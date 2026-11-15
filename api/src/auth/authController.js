const AuthService = require('./authService');
const TokenService = require('../token/tokenService');
const { UsuarioPublic } = require('../dtos/usuarioPublic');
const { UnauthorizedError } = require('../errors/AppError');

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
}

module.exports = { AuthController };
