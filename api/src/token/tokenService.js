const JwtUtils = require('./jwtUtils');

class TokenService {
    constructor() { this.jwt = new JwtUtils() }

    // Duración (en ms) de cada token: se usa para el maxAge de las cookies
    get duracionAccessMs() { return this.jwt.accessMs }
    get duracionRefreshMs() { return this.jwt.refreshMs }

    // Recibe un usuario ya verificado (por ejemplo, el que devuelve AuthService.verificarUsuario)
    generarTokens(usuario) {
        return this.jwt.generarTokens(usuario);
    }

    // Verifica la firma y vigencia del refresh token y devuelve su payload
    verificarRefreshToken(refreshToken) {
        return this.jwt.verificarRefreshToken(refreshToken);
    }

    // Valida el refresh token y emite un par de tokens nuevo con los mismos datos
    refrescarTokens(refreshToken) {
        const payload = this.jwt.verificarRefreshToken(refreshToken);
        return this.jwt.generarTokens(payload);
    }
}

module.exports = TokenService;
