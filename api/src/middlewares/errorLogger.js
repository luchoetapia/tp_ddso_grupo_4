const { obtenerStatusCode } = require("./errorHandler.js");

const ROJO = "\x1b[31m";
const AMARILLO = "\x1b[33m";
const RESET = "\x1b[0m";

function errorLogger(err, req, res, next) {
    const statusCode = obtenerStatusCode(err);
    const linea = `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${statusCode} | ${err.name}: ${err.message}`;

    if (statusCode >= 500)
        console.error(`${ROJO}${linea}\n${err.stack}${RESET}`);
    else
        console.error(`${AMARILLO}${linea}${RESET}`);

    next(err)
}

module.exports = { errorLogger };
