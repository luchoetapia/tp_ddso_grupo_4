const AuthService = require('./authService');
const TokenService = require('../token/tokenService');
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

        const usuario = await this.service.verificarUsuario(accessKey, password);
        enviarTokensEnCookies(res, this.token.generarTokens(usuario));

        res.status(200).json({ usuario: UsuarioPublic.desde(usuario) });
    }

    registro = async (req, res) => {
        const { username, password, email, rol } = req.body;

        const usuario = await this.service.registrarUsuario(username, password, email, rol);
        enviarTokensEnCookies(res, this.token.generarTokens(usuario));

        res.status(201).json({ usuario: UsuarioPublic.desde(usuario) });
    }
}

module.exports = { AuthController };
