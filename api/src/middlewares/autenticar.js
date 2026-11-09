const JwtUtils = require('../token/jwtUtils.js');
const { UnauthorizedError } = require('../errors/AppError.js');

let jwtUtils;

// El access token viaja en la cookie httpOnly "accessToken" (requiere cookie-parser).
// Como alternativa (Postman, Swagger) también se acepta el header "Authorization: Bearer <token>".
const obtenerToken = (req) => {
    if (req.cookies?.accessToken) return req.cookies.accessToken;

    const [tipo, token] = (req.headers?.authorization ?? '').split(' ');
    return tipo === 'Bearer' && token ? token : null;
};

// rolesPermitidos: string, lista de strings, o nada (solo exige un token válido)
const autenticar = (rolesPermitidos) => {
    return (req, _, next) => {
        jwtUtils ??= new JwtUtils();

        const token = obtenerToken(req);
        if (!token) throw new UnauthorizedError('Falta el token de acceso');

        const payload = jwtUtils.verificarAccessToken(token);
        if (rolesPermitidos) jwtUtils.validarRol(payload, rolesPermitidos);

        req.usuario = payload;
        next();
    }
}

module.exports = autenticar;
