const JwtUtils = require('../token/jwtUtils.js');
const { UnauthorizedError } = require('../errors/AppError.js');

let jwtUtils;

// rolesPermitidos: string, lista de strings, o nada (solo exige un token válido)
const autenticar = (rolesPermitidos) => {
    return (req, _, next) => {
        jwtUtils ??= new JwtUtils();

        const [tipo, token] = (req.headers.authorization ?? '').split(' ');
        if (tipo !== 'Bearer' || !token) throw new UnauthorizedError('Falta el token de acceso');

        const payload = jwtUtils.verificarAccessToken(token);
        if (rolesPermitidos) jwtUtils.validarRol(payload, rolesPermitidos);

        req.usuario = payload;
        next();
    }
}

module.exports = autenticar;
