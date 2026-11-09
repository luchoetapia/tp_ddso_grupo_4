const { requestLogger } = require("./middlewares/requestLogger.js");
const { notFoundHandler } = require("./middlewares/notFoundHandler.js");
const { errorLogger } = require("./middlewares/errorLogger.js");
const { errorHandler } = require("./middlewares/errorHandler.js");

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

const router = require("./routers/router.js");

// CORS: orígenes válidos desde CORS_ORIGINS (separados por coma).
// Si no está definida, se permiten todos los orígenes.
const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
}));

// Logs de consultas exitosas
app.use(requestLogger);

app.use(express.json());
// Parsea las cookies de la request en req.cookies (el access token viaja en la cookie httpOnly)
app.use(cookieParser());
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
