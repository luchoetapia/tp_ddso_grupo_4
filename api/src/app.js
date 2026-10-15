const { requestLogger } = require("./middlewares/requestLogger.js");
const { notFoundHandler } = require("./middlewares/notFoundHandler.js");
const { errorLogger } = require("./middlewares/errorLogger.js");
const { errorHandler } = require("./middlewares/errorHandler.js");

const express = require('express');
const app = express();

const router = require("./routers/router.js");

// Logs de consultas exitosas
app.use(requestLogger);

app.use(express.json());
app.use(router);

// Rutas de checkeo
app.get('/', (req, res) => {
    res.send('¡Hola Mundo!');
});

app.get("/healthcheck", (request, response) => {
    response.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
    })
})

// Handlers de errores
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

module.exports = app;
