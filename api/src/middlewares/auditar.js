const JwtUtils = require('../token/jwtUtils.js');
const { obtenerToken } = require('./autenticar.js');
const auditoriaService = require('../services/auditoriaService.js');

let jwtUtils;

// Autor de la acción: el usuario autenticado o, en rutas sin autenticar, el del token si viene uno válido
const autorDe = (req) => {
    if (req.usuario) return req.usuario;

    const token = obtenerToken(req);
    if (!token) return null;
    try {
        jwtUtils ??= new JwtUtils();
        return jwtUtils.verificarAccessToken(token);
    } catch {
        return null;
    }
};

const loguearError = (accion, error) =>
    console.error(`\x1b[31m${new Date().toISOString()} | Auditoría de '${accion}' | ${error.name}: ${error.message}\n${error.stack}\x1b[0m`);

const auditar = (accion, describir) => (req, res, next) => {
    const enviarJson = res.json.bind(res);

    res.json = async (body) => {
        if (res.statusCode < 400) {
            const nombreAccion = typeof accion === 'function' ? accion(req, body) : accion;
            try {
                await auditoriaService.registrar({
                    accion: nombreAccion,
                    autor: autorDe(req),
                    ...describir(req, body, res)
                });
            } catch (error) {
                loguearError(nombreAccion, error);
            }
        }
        return enviarJson(body);
    };

    next();
};

module.exports = auditar;
