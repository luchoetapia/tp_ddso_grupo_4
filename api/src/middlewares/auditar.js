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

// Registra en la auditoría la acción de la ruta, solo si la respuesta salió bien (status < 400).
// accion: AccionAuditada, o (req, body) => AccionAuditada si depende del pedido.
// describir: (req, body, res) => { entidad: { tipo, id }, idColectivo?, idProyecto?, detalle? }
//   body es la respuesta JSON del controller; res.locals sirve para pasar datos que no van en la respuesta.
// Se registra antes de enviar la respuesta; si falla, se loguea y la respuesta sale igual (la acción ya se hizo).
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
