const { obtenerStatusCode } = require("./errorHandler.js");

function errorLogger(err, req, res, next) {
    const statusCode = obtenerStatusCode(err);
    const linea = `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${statusCode} | ${err.name}: ${err.message}`;

    if (statusCode >= 500) 
        console.error(`${linea}\n${err.stack}`);
    else
        console.error(linea);

    next(err)
}

module.exports = { errorLogger };
