const { AppError, BadGatewayError, ConflictError, ForbiddenError } = require('../errors/AppError');
const { SCOPE_PUBLICAR_LINKEDIN } = require('../auth/models/usuario');

// Endpoints de "Sign In with LinkedIn using OpenID Connect"
const URL_AUTORIZACION = 'https://www.linkedin.com/oauth/v2/authorization';
const URL_TOKEN = 'https://www.linkedin.com/oauth/v2/accessToken';
const URL_USERINFO = 'https://api.linkedin.com/v2/userinfo';
// Posts API (producto "Share on LinkedIn" de la app)
const URL_POSTS = 'https://api.linkedin.com/rest/posts';

// w_member_social: publicar en nombre del usuario
const SCOPES = `openid profile email ${SCOPE_PUBLICAR_LINKEDIN}`;
const TIMEOUT_MS = 10000;
// Si LINKEDIN_API_VERSION no está configurada
const VERSION_API_DEFAULT = '202610';

// Límite de caracteres del texto de un post
const MAX_CARACTERES_POST = 3000;

// Código que viaja en details para que el front sepa que tiene que (re)conectar LinkedIn
const CODIGO_NO_VINCULADO = 'LINKEDIN_NO_VINCULADO';
// LinkedIn no deja publicar dos veces exactamente el mismo texto
const CODIGO_DUPLICADO = 'LINKEDIN_DUPLICADO';

// Link a un post a partir de su urn (urn:li:share:... o urn:li:ugcPost:...)
const urlDelPost = (urn) => (urn ? `https://www.linkedin.com/feed/update/${urn}/` : null);

class LinkedinNoVinculadoError extends ForbiddenError {
    constructor(message = 'Para publicar tenés que conectar tu cuenta de LinkedIn') {
        super(message, [{ codigo: CODIGO_NO_VINCULADO }]);
    }
}

// El texto de los posts usa "Little Text Format": estos caracteres tienen significado especial
// y, sin escapar, LinkedIn rechaza el post o lo corta
const escaparTexto = (texto) => texto.replace(/[\\|{}@\[\]()<>#*_~]/g, (c) => `\\${c}`);

class LinkedinService {
    _config() {
        const { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI } = process.env;

        if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !LINKEDIN_REDIRECT_URI)
            throw new AppError('El ingreso con LinkedIn no está configurado en el servidor', 500);

        return { clientId: LINKEDIN_CLIENT_ID, clientSecret: LINKEDIN_CLIENT_SECRET, redirectUri: LINKEDIN_REDIRECT_URI };
    }

    urlDeAutorizacion(state) {
        const { clientId, redirectUri } = this._config();

        const url = new URL(URL_AUTORIZACION);
        url.search = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            state,
            scope: SCOPES,
        }).toString();

        return url.toString();
    }

    async canjearCodigo(code) {
        const { clientId, clientSecret, redirectUri } = this._config();

        const respuesta = await this._pedir(URL_TOKEN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
            }),
        }, 'el código de autorización');

        if (!respuesta.access_token) throw new BadGatewayError('LinkedIn no devolvió un access token');

        // LinkedIn manda los scopes otorgados separados por coma (o espacio) y la duración en segundos
        return {
            accessToken: respuesta.access_token,
            expiraEn: new Date(Date.now() + (Number(respuesta.expires_in) || 0) * 1000),
            scopes: String(respuesta.scope ?? '').split(/[\s,]+/).filter(Boolean),
        };
    }

    async obtenerDatos(accessToken) {
        const datos = await this._pedir(URL_USERINFO, {
            headers: { Authorization: `Bearer ${accessToken}` },
        }, 'los datos del perfil');

        if (!datos.sub || !datos.email) throw new BadGatewayError('LinkedIn no devolvió los datos necesarios del perfil');

        return {
            sub: datos.sub,
            email: datos.email,
            emailVerificado: datos.email_verified === true,
            nombre: datos.given_name ?? null,
            apellido: datos.family_name ?? null,
            foto: datos.picture ?? null,
        };
    }

    // Publica un post de texto en el perfil del usuario (sub = id de la persona en LinkedIn).
    // Devuelve el id del post (urn) que LinkedIn manda en el header x-restli-id.
    async publicar(accessToken, sub, texto) {
        const { cabeceras } = await this._pedir(URL_POSTS, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': process.env.LINKEDIN_API_VERSION || VERSION_API_DEFAULT,
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify({
                author: `urn:li:person:${sub}`,
                commentary: escaparTexto(texto),
                visibility: 'PUBLIC',
                distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
                lifecycleState: 'PUBLISHED',
                isReshareDisabledByAuthor: false,
            }),
        }, 'la publicación', { conCabeceras: true, tokenDelUsuario: true });

        return cabeceras.get('x-restli-id');
    }

    // fetch con timeout; cualquier falla (red, timeout o respuesta de error) se traduce a BadGatewayError (502)
    // conCabeceras: devuelve { cuerpo, cabeceras } en lugar de solo el cuerpo (para leer x-restli-id).
    // tokenDelUsuario: la llamada usa el token guardado del usuario; un 401 significa que venció
    // o que el usuario revocó el acceso, y hay que reconectar.
    async _pedir(url, opciones, queSePedia, { conCabeceras = false, tokenDelUsuario = false } = {}) {
        let respuesta;
        try {
            respuesta = await fetch(url, { ...opciones, signal: AbortSignal.timeout(TIMEOUT_MS) });
        } catch {
            throw new BadGatewayError('No se pudo conectar con LinkedIn');
        }

        const cuerpo = await respuesta.json().catch(() => ({}));

        if (respuesta.status === 401 && tokenDelUsuario)
            throw new LinkedinNoVinculadoError('Tu conexión con LinkedIn venció o fue revocada. Volvé a conectar tu cuenta');

        // 422 "Content is a duplicate of urn:li:share:123": ese mismo texto ya está publicado
        const mensajeLinkedin = String(cuerpo.message ?? '');
        if (respuesta.status === 422 && /duplicate/i.test(mensajeLinkedin)) {
            const urn = mensajeLinkedin.match(/urn:li:(?:share|ugcPost):\d+/)?.[0] ?? null;
            throw new ConflictError(
                'Ya publicaste este mismo texto en LinkedIn. Cambialo un poco para volver a publicar',
                [{ codigo: CODIGO_DUPLICADO, url: urlDelPost(urn) }]
            );
        }

        // LinkedIn responde con error
        if (!respuesta.ok)
            throw new BadGatewayError(
                `LinkedIn rechazó la solicitud de ${queSePedia}`,
                [cuerpo.error_description ?? cuerpo.message ?? `HTTP ${respuesta.status}`]
            );

        return conCabeceras ? { cuerpo, cabeceras: respuesta.headers } : cuerpo;
    }
}

module.exports = new LinkedinService();
module.exports.LinkedinNoVinculadoError = LinkedinNoVinculadoError;
module.exports.escaparTexto = escaparTexto;
module.exports.MAX_CARACTERES_POST = MAX_CARACTERES_POST;
module.exports.CODIGO_NO_VINCULADO = CODIGO_NO_VINCULADO;
module.exports.CODIGO_DUPLICADO = CODIGO_DUPLICADO;
module.exports.urlDelPost = urlDelPost;
