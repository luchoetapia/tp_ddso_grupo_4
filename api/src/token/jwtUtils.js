const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } =require('../errors/AppError');

const ACCESS_EXPIRACION = '15m';
const REFRESH_EXPIRACION = '7d';

class JwtUtils {
    constructor() {
        this.accessKey = process.env.JWT_ACCESS_KEY;
        this.refreshKey = process.env.JWT_REFRESH_KEY;

        if (!this.accessKey || !this.refreshKey)
            throw new Error('Faltan las variables de entorno JWT_ACCESS_KEY y/o JWT_REFRESH_KEY');
    }

    _payload(usuario) {
        return { id: usuario._id?.toString() ?? usuario.id, username: usuario.username, rol: usuario.rol };
    }

    generarAccessToken(usuario) {
        return jwt.sign(this._payload(usuario), this.accessKey, { expiresIn: ACCESS_EXPIRACION });
    }

    generarRefreshToken(usuario) {
        return jwt.sign(this._payload(usuario), this.refreshKey, { expiresIn: REFRESH_EXPIRACION });
    }

    generarTokens(usuario) {
        return {
            accessToken: this.generarAccessToken(usuario),
            refreshToken: this.generarRefreshToken(usuario)
        };
    }

    _verificar(token, clave) {
        try {
            return jwt.verify(token, clave);
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) throw new UnauthorizedError('El token expiró');
            throw new UnauthorizedError('Token inválido');
        }
    }

    verificarAccessToken(token) { return this._verificar(token, this.accessKey) }
    verificarRefreshToken(token) { return this._verificar(token, this.refreshKey) }

    // rolesPermitidos puede ser un string ('admin') o una lista (['admin', 'colaborador'])
    validarRol(payload, rolesPermitidos) {
        const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];

        if (!payload?.rol || !roles.includes(payload.rol))
            throw new ForbiddenError('No tenés permisos para acceder a este recurso');

        return true;
    }
}

module.exports = JwtUtils;
