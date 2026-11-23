const AuthService = require('./authService');
const TokenService = require('../token/tokenService');
const linkedinService = require('../linkedin/linkedinService');
const stateLinkedin = require('../linkedin/stateLinkedin');
const colaboradorService = require('../services/colaboradorService');
const { validarCallbackLinkedin, validarVincularLinkedin } = require('./authValidator');
const { UsuarioPublic } = require('../dtos/usuarioPublic');
const { AppError, UnauthorizedError, BadGatewayError } = require('../errors/AppError');

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

// Cookie con el "state" de OAuth (JWT firmado, ver linkedin/stateLinkedin.js): se crea al ir a LinkedIn
// y se compara cuando LinkedIn vuelve al callback (CSRF). También guarda si era un ingreso o una vinculación.
const COOKIE_STATE_LINKEDIN = 'linkedinState';
const DURACION_STATE_LINKEDIN_MS = 10 * 60 * 1000;

// sameSite 'lax' (y no 'strict'): el callback llega navegando desde linkedin.com, que es otro sitio,
// y con 'strict' el navegador no mandaría esta cookie en esa navegación
const opcionesCookieStateLinkedin = () => ({ ...opcionesBaseCookie(), sameSite: 'lax' });

// Pantallas del front a las que se redirige al terminar
const RUTA_INICIO_COLABORADOR = '/colaboradoras/inicio';
const RUTA_COMPLETAR_PERFIL = '/registro';
const RUTA_INGRESAR = '/ingresar';
const RUTA_DATOS_PERSONALES = '/colaboradoras/datos-personales';

// Los params se agregan a los que ya tenga la ruta (ej: /proyectos/ver?id=...).
// La ruta siempre es relativa al front (validada con rutaInterna): no se puede redirigir a otro sitio.
const urlDelFront = (ruta, params) => {
    const url = new URL(ruta, process.env.FRONT_URL || 'http://localhost:3001');
    if (params) Object.entries(params).forEach(([clave, valor]) => url.searchParams.set(clave, valor));
    return url.toString();
};

// Como el callback es una navegación del navegador, los errores se muestran redirigiendo al front con el mensaje:
// al login si se estaba ingresando, o a la pantalla desde donde se quiso vincular
const redirigirConErrorLinkedin = (res, error, ruta = RUTA_INGRESAR) => {
    // Los BadGateway (LinkedIn respondió con error) también se muestran: el mensaje no expone nada interno
    const esConocido = error instanceof AppError && (error.statusCode < 500 || error instanceof BadGatewayError);
    if (!(error instanceof AppError) || error.statusCode >= 500) console.error('[LinkedIn]', error);

    const mensaje = esConocido ? error.message : 'No se pudo conectar con LinkedIn. Intentá de nuevo más tarde';
    res.redirect(urlDelFront(ruta, { errorLinkedin: mensaje }));
};

// LinkedIn vuelve con ?error=... si el usuario canceló (user_cancelled_login / user_cancelled_authorize)
// o si rechazó el pedido (ej: unauthorized_scope_error cuando la app no tiene el producto "Share on LinkedIn")
const errorDevueltoPorLinkedin = ({ error, error_description: descripcion }, vinculando) => {
    if (String(error).startsWith('user_cancelled'))
        return new UnauthorizedError(vinculando ? 'Se canceló la conexión con LinkedIn' : 'Se canceló el ingreso con LinkedIn');

    console.error('[LinkedIn] La autorización volvió con error:', error, descripcion ?? '');
    return new BadGatewayError(`LinkedIn rechazó la solicitud (${error})`);
};

const irALinkedin = (res, datosState) => {
    const { state, cookie } = stateLinkedin.crear(datosState);
    const url = linkedinService.urlDeAutorizacion(state);

    res.cookie(COOKIE_STATE_LINKEDIN, cookie, { ...opcionesCookieStateLinkedin(), maxAge: DURACION_STATE_LINKEDIN_MS });
    res.redirect(url);
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

    // GET /auth/linkedin: guarda el state en una cookie y manda al usuario a iniciar sesión en LinkedIn
    linkedin = async (req, res) => {
        try {
            irALinkedin(res, { modo: stateLinkedin.MODOS.INGRESO });
        } catch (error) {
            redirigirConErrorLinkedin(res, error);
        }
    }

    // GET /auth/linkedin/vincular?volverA=/ruta&publicar=idProyecto (colaborador con sesión iniciada):
    // conecta LinkedIn a la cuenta actual para poder publicar. Al terminar vuelve a volverA con
    // ?linkedin=vinculado (y publicar, para que el front reabra el modal de publicación).
    vincular = async (req, res) => {
        // Query inválida (ej: volverA a otro sitio): se ignora y se usan los valores por defecto
        const query = validarVincularLinkedin.safeParse(req.query);
        const { volverA = RUTA_DATOS_PERSONALES, publicar } = query.success ? query.data : {};

        try {
            irALinkedin(res, { modo: stateLinkedin.MODOS.VINCULAR, usuarioId: req.usuario.id, volverA, publicar });
        } catch (error) {
            redirigirConErrorLinkedin(res, error, volverA);
        }
    }

    // GET /auth/linkedin/callback: LinkedIn vuelve acá con ?code&state (o con ?error si el usuario canceló).
    // Valida el state y, según el modo guardado en la cookie:
    //  - ingreso: inicia la sesión (cookies) y redirige: sin perfil de colaborador -> completar registro; con perfil -> inicio.
    //  - vincular: asocia LinkedIn al usuario que inició el flujo (la sesión ya existe) y vuelve a la pantalla de origen.
    // En los dos casos guarda el token de LinkedIn para poder publicar.
    linkedinCallback = async (req, res) => {
        // El state sirve una sola vez: se borra siempre, salga bien o mal
        const datosState = stateLinkedin.leer(req.cookies?.[COOKIE_STATE_LINKEDIN]);
        res.clearCookie(COOKIE_STATE_LINKEDIN, opcionesCookieStateLinkedin());

        const vinculando = datosState?.modo === stateLinkedin.MODOS.VINCULAR;
        const rutaError = vinculando ? datosState.volverA : RUTA_INGRESAR;

        try {
            if (req.query.error) throw errorDevueltoPorLinkedin(req.query, vinculando);

            const query = validarCallbackLinkedin.safeParse(req.query);
            if (!query.success || !stateLinkedin.coincide(datosState, query.data.state))
                throw new UnauthorizedError('La solicitud a LinkedIn no es válida o venció. Volvé a intentar');

            const token = await linkedinService.canjearCodigo(query.data.code);
            const datos = await linkedinService.obtenerDatos(token.accessToken);

            if (vinculando) {
                await this.service.vincularLinkedin(datosState.usuarioId, datos, token);

                const params = { linkedin: 'vinculado' };
                if (datosState.publicar) params.publicar = datosState.publicar;
                return res.redirect(urlDelFront(datosState.volverA, params));
            }

            const usuario = await this.service.ingresarConLinkedin(datos, token);

            this.enviarSesion(res, usuario);

            const perfil = await colaboradorService.buscarPorUsuario(usuario.id);
            res.redirect(perfil
                ? urlDelFront(RUTA_INICIO_COLABORADOR)
                : urlDelFront(RUTA_COMPLETAR_PERFIL, { origen: 'linkedin' }));
        } catch (error) {
            redirigirConErrorLinkedin(res, error, rutaError);
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
