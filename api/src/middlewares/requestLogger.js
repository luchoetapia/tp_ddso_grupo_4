const VERDE = "\x1b[32m";
const AZUL = "\x1b[34m";
const RESET = "\x1b[0m";

function requestLogger(req, res, next) {
    let message;

    const jsonOriginal = res.json.bind(res);
    res.json = (body) => {
        message = body?.message;
        return jsonOriginal(body);
    };

    res.on("finish", () => {
        const statusCode = res.statusCode;

        // Los errores (4XX/5XX) los loguea errorLogger
        if (statusCode >= 400) return;

        let linea = `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${statusCode}`;
        if (message) linea += ` | ${message}`;

        const color = statusCode >= 300 ? AZUL : VERDE;
        console.log(`${color}${linea}${RESET}`);
    });

    next();
}

module.exports = { requestLogger };
