const { AppError, BadGatewayError } = require('../errors/AppError');

// Endpoints de "Sign In with LinkedIn using OpenID Connect"
const URL_AUTORIZACION = 'https://www.linkedin.com/oauth/v2/authorization';
const URL_TOKEN = 'https://www.linkedin.com/oauth/v2/accessToken';
const URL_USERINFO = 'https://api.linkedin.com/v2/userinfo';

const SCOPES = 'openid profile email';
const TIMEOUT_MS = 10000;

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
        return respuesta.access_token;
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

    // fetch con timeout; cualquier falla (red, timeout o respuesta de error) se traduce a BadGatewayError (502)
    async _pedir(url, opciones, queSePedia) {
        let respuesta;
        try {
            respuesta = await fetch(url, { ...opciones, signal: AbortSignal.timeout(TIMEOUT_MS) });
        } catch {
            throw new BadGatewayError('No se pudo conectar con LinkedIn');
        }

        const cuerpo = await respuesta.json().catch(() => ({}));

        // LinkedIn responde con error
        if (!respuesta.ok)
            throw new BadGatewayError(
                `LinkedIn rechazó la solicitud de ${queSePedia}`,
                [cuerpo.error_description ?? cuerpo.message ?? `HTTP ${respuesta.status}`]
            );

        return cuerpo;
    }
}

module.exports = new LinkedinService();
