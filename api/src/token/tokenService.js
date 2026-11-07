const JwtUtils = require('./jwtUtils');

class TokenService {
    constructor() { this.jwt = new JwtUtils() }

    // Recibe un usuario ya verificado (por ejemplo, el que devuelve AuthService.verificarUsuario)
    generarTokens(usuario) {
        return this.jwt.generarTokens(usuario);
    }

    // Valida el refresh token y emite un par de tokens nuevo con los mismos datos
    refrescarTokens(refreshToken) {
        const payload = this.jwt.verificarRefreshToken(refreshToken);
        return this.jwt.generarTokens(payload);
    }
}

module.exports = TokenService;
