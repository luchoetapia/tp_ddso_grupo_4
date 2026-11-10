const jwt = require('jsonwebtoken');
const ms = require('ms');
const { UnauthorizedError, ForbiddenError } =require('../errors/AppError');

// Duraciones por defecto, configurables con JWT_ACCESS_TIME y JWT_REFRESH_TIME
const ACCESS_TIME_DEFAULT = '15m';
const REFRESH_TIME_DEFAULT = '7d';

// Formato válido: número entero + unidad (s, m, h, d, w). Ej: "30s", "15m", "2h", "7d".
// Se exige la unidad porque jsonwebtoken interpreta un número sin unidad como milisegundos.
const FORMATO_DURACION = /^[1-9]\d*[smhdw]$/;

const leerDuracion = (nombreVariable, valorPorDefecto) => {
    const valor = (process.env[nombreVariable] ?? '').trim() || valorPorDefecto;

    if (!FORMATO_DURACION.test(valor))
        throw new Error(`${nombreVariable} inválida ("${valor}"): usar un número entero con unidad s, m, h, d o w (ej: 15m, 7d)`);

    return valor;
};

class JwtUtils {
    constructor() {
        this.accessKey = process.env.JWT_ACCESS_KEY;
        this.refreshKey = process.env.JWT_REFRESH_KEY;

        if (!this.accessKey || !this.refreshKey)
            throw new Error('Faltan las variables de entorno JWT_ACCESS_KEY y/o JWT_REFRESH_KEY');

        // Misma fuente para el vencimiento del JWT (expiresIn) y el maxAge de la cookie: no se pueden desfasar
        this.accessTime = leerDuracion('JWT_ACCESS_TIME', ACCESS_TIME_DEFAULT);
        this.refreshTime = leerDuracion('JWT_REFRESH_TIME', REFRESH_TIME_DEFAULT);
        this.accessMs = ms(this.accessTime);
        this.refreshMs = ms(this.refreshTime);
    }

    _payload(usuario) {
        return { id: usuario._id?.toString() ?? usuario.id, username: usuario.username, rol: usuario.rol };
    }

    generarAccessToken(usuario) {
        return jwt.sign(this._payload(usuario), this.accessKey, { expiresIn: this.accessTime });
    }

    generarRefreshToken(usuario) {
        return jwt.sign(this._payload(usuario), this.refreshKey, { expiresIn: this.refreshTime });
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
