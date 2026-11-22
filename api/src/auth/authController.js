const crypto = require('crypto');
const AuthService = require('./authService');
const TokenService = require('../token/tokenService');
const linkedinService = require('../linkedin/linkedinService');
const colaboradorService = require('../services/colaboradorService');
const { validarCallbackLinkedin } = require('./authValidator');
const { UsuarioPublic } = require('../dtos/usuarioPublic');
const { AppError, UnauthorizedError } = require('../errors/AppError');

// httpOnly: el JS del front no puede leerlas (protege contra XSS)
const opcionesBaseCookie = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
});

const opcionesCookie = (maxAge) => ({ ...opcionesBaseCookie(), maxAge });

// Las cookies duran lo mismo que los tokens (JWT_ACCESS_TIME / JWT_REFRESH_TIME)
const enviarTokensEnCookies = (res, { accessToken, refreshToken }, { accessMs, refreshMs }) => {
    res.cookie('accessToken', accessToken, opcionesCookie(accessMs));
    res.cookie('refreshToken', refreshToken, opcionesCookie(refreshMs));
};

// Para que el navegador borre una cookie, clearCookie debe recibir las mismas opciones con las que se creó
const borrarCookies = (res) => {
    res.clearCookie('accessToken', opcionesBaseCookie());
    res.clearCookie('refreshToken', opcionesBaseCookie());
};

// --- Ingreso con LinkedIn ---

// Cookie con el "state" de OAuth: se crea al ir a LinkedIn y se compara cuando LinkedIn vuelve al callback (CSRF)
const COOKIE_STATE_LINKEDIN = 'linkedinState';
const DURACION_STATE_LINKEDIN_MS = 10 * 60 * 1000;

// sameSite 'lax' (y no 'strict'): el callback llega navegando desde linkedin.com, que es otro sitio,
// y con 'strict' el navegador no mandaría esta cookie en esa navegación
const opcionesCookieStateLinkedin = () => ({ ...opcionesBaseCookie(), sameSite: 'lax' });

// Pantallas del front a las que se redirige al terminar
const RUTA_INICIO_COLABORADOR = '/colaboradoras/inicio';
const RUTA_COMPLETAR_PERFIL = '/registro';
const RUTA_INGRESAR = '/ingresar';

const urlDelFront = (ruta, params) => {
    const url = new URL(ruta, process.env.FRONT_URL || 'http://localhost:3001');
    if (params) url.search = new URLSearchParams(params).toString();
    return url.toString();
};

// Comparación en tiempo constante (no revela por timing cuántos caracteres coinciden)
const mismoState = (recibido, guardado) => {
    if (!guardado) return false;

    const a = Buffer.from(recibido);
    const b = Buffer.from(guardado);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Como el callback es una navegación del navegador, los errores se muestran redirigiendo al login con el mensaje
const redirigirConErrorLinkedin = (res, error) => {
    const esConocido = error instanceof AppError && error.statusCode < 500;
    if (!esConocido) console.error('[LinkedIn]', error);

    const mensaje = esConocido ? error.message : 'No se pudo ingresar con LinkedIn. Intentá de nuevo más tarde';
    res.redirect(urlDelFront(RUTA_INGRESAR, { errorLinkedin: mensaje }));
};

class AuthController {
    constructor() {
        this.service = new AuthService();
        this.token = new TokenService();
    }

    enviarSesion = (res, usuario) => {
        enviarTokensEnCookies(res, this.token.generarTokens(usuario), {
            accessMs: this.token.duracionAccessMs,
            refreshMs: this.token.duracionRefreshMs,
        });
    }

    // accessKey puede ser el username o el email
    login = async (req, res) => {
        const { accessKey, password } = req.body;

        const usuario = await this.service.verificarUsuario(accessKey, password);
        this.enviarSesion(res, usuario);

        res.status(200).json({ usuario: UsuarioPublic.desde(usuario) });
    }

    registro = async (req, res) => {
        const { username, password, email, rol } = req.body;

        const usuario = await this.service.registrarUsuario(username, password, email, rol);
        this.enviarSesion(res, usuario);

        res.status(201).json({ usuario: UsuarioPublic.desde(usuario) });
    }

    // Renueva el par de tokens a partir de la cookie refreshToken.
    // Se vuelve a leer el usuario de la base: así se respetan desactivaciones y cambios de rol.
    refresh = async (req, res) => {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) throw new UnauthorizedError('Falta el refresh token');

            const payload = this.token.verificarRefreshToken(refreshToken);
            const usuario = await this.service.obtenerUsuarioActivo(payload.id);

            this.enviarSesion(res, usuario);
            res.status(200).json({ usuario: UsuarioPublic.desde(usuario) });
        } catch (error) {
            // Si la sesión no se puede renovar, se limpian las cookies para no dejar tokens inservibles
            borrarCookies(res);
            throw error;
        }
    }

    // Idempotente: funciona aunque no haya sesión
    logout = async (req, res) => {
        borrarCookies(res);
        res.status(200).json({ message: 'Sesión cerrada' });
    }

    // Usuario de la sesión actual (el front no puede leer las cookies httpOnly)
    me = async (req, res) => {
        const usuario = await this.service.obtenerUsuarioActivo(req.usuario.id);

        res.status(200).json({ usuario: UsuarioPublic.desde(usuario) });
    }

    // GET /auth/linkedin: guarda un state aleatorio en una cookie y manda al usuario a iniciar sesión en LinkedIn
    linkedin = async (req, res) => {
        try {
            const state = crypto.randomBytes(32).toString('hex');
            const url = linkedinService.urlDeAutorizacion(state);

            res.cookie(COOKIE_STATE_LINKEDIN, state, { ...opcionesCookieStateLinkedin(), maxAge: DURACION_STATE_LINKEDIN_MS });
            res.redirect(url);
        } catch (error) {
            redirigirConErrorLinkedin(res, error);
        }
    }

    // GET /auth/linkedin/callback: LinkedIn vuelve acá con ?code&state (o con ?error si el usuario canceló).
    // Valida el state, obtiene los datos del perfil, inicia la sesión (cookies) y redirige al front:
    // sin perfil de colaborador -> completar registro; con perfil -> inicio.
    linkedinCallback = async (req, res) => {
        // El state sirve una sola vez: se borra siempre, salga bien o mal
        const stateGuardado = req.cookies?.[COOKIE_STATE_LINKEDIN];
        res.clearCookie(COOKIE_STATE_LINKEDIN, opcionesCookieStateLinkedin());

        try {
            if (req.query.error) throw new UnauthorizedError('Se canceló el ingreso con LinkedIn');

            const query = validarCallbackLinkedin.safeParse(req.query);
            if (!query.success || !mismoState(query.data.state, stateGuardado))
                throw new UnauthorizedError('La solicitud de ingreso con LinkedIn no es válida o venció. Volvé a intentar');

            const accessToken = await linkedinService.canjearCodigo(query.data.code);
            const datos = await linkedinService.obtenerDatos(accessToken);
            const usuario = await this.service.ingresarConLinkedin(datos);

            this.enviarSesion(res, usuario);

            const perfil = await colaboradorService.buscarPorUsuario(usuario.id);
            res.redirect(perfil
                ? urlDelFront(RUTA_INICIO_COLABORADOR)
                : urlDelFront(RUTA_COMPLETAR_PERFIL, { origen: 'linkedin' }));
        } catch (error) {
            redirigirConErrorLinkedin(res, error);
        }
    }

    validar = async (req, res) => {
        const username = req.query.username.trim();
        const email = req.query.email;

        await this.service.verificarUsernameYEmail(username, email);

        res.status(200).json({ disponible: true });
    }
}

module.exports = { AuthController };
