const AuthService = require('./authService');
const TokenService = require('../token/tokenService');
const { roles } = require('./models/usuario');
const { BadRequestError } = require('../errors/AppError');
const { UsuarioPublic } = require('../dtos/usuarioPublic');

// httpOnly: el JS del front no puede leerlas (protege contra XSS)
const opcionesCookie = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge
});

const enviarTokensEnCookies = (res, { accessToken, refreshToken }) => {
    res.cookie('accessToken', accessToken, opcionesCookie(15 * 60 * 1000));            // 15 min
    res.cookie('refreshToken', refreshToken, opcionesCookie(7 * 24 * 60 * 60 * 1000)); // 7 días
};

class AuthController {
    constructor() {
        this.service = new AuthService();
        this.token = new TokenService();
    }

    // accessKey puede ser el username o el email
    login = async (req, res) => {
        const { accessKey, password } = req.body;
        if (!accessKey || !password) throw new BadRequestError('Faltan accessKey y/o password');

        const usuario = await this.service.verificarUsuario(accessKey, password);
        enviarTokensEnCookies(res, this.token.generarTokens(usuario));

        res.status(200).json({ usuario: UsuarioPublic.desde(usuario) });
    }

    registro = async (req, res) => {
        const { username, password, email, rol } = req.body;
        if (!username || !password || !email || !rol)
            throw new BadRequestError('Faltan username, password, email y/o rol');

        // Por el registro público solo se pueden crear colaboradores o colectivos, nunca admins
        if (![roles.COLABORADOR, roles.COLECTIVO].includes(rol))
            throw new BadRequestError(`El rol debe ser '${roles.COLABORADOR}' o '${roles.COLECTIVO}'`);

        const usuario = await this.service.registrarUsuario(username, password, email, rol);
        enviarTokensEnCookies(res, this.token.generarTokens(usuario));

        res.status(201).json({ usuario: UsuarioPublic.desde(usuario) });
    }
}

module.exports = { AuthController };
