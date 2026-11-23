const { obtenerStatusCode } = require("./errorHandler.js");

const ROJO = "\x1b[31m";
const AMARILLO = "\x1b[33m";
const RESET = "\x1b[0m";

function errorLogger(err, req, res, next) {
    const statusCode = obtenerStatusCode(err);
    const linea = `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${statusCode} | ${err.name}: ${err.message}`;

    // details de los 5xx: por ejemplo, el motivo que dio LinkedIn al rechazar una solicitud
    const detalles = err.details?.length ? `\nDetalles: ${JSON.stringify(err.details)}` : '';

    if (statusCode >= 500)
        console.error(`${ROJO}${linea}${detalles}\n${err.stack}${RESET}`);
    else
        console.error(`${AMARILLO}${linea}${RESET}`);

    next(err)
}

module.exports = { errorLogger };
