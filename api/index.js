const { requestLogger } = require("./src/middlewares/requestLogger.js");
const { notFoundHandler } = require("./src/middlewares/notFoundHandler.js");
const { errorLogger } = require("./src/middlewares/errorLogger.js");
const { errorHandler } = require("./src/middlewares/errorHandler.js");
const mongoClient = require("./src/database/mongoose.js");

require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const router = require("./src/routers/router.js");

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

app.listen(PORT, async () => {
    console.log(`Servidor en http://localhost:${PORT}`);

    try {
        await mongoClient.connect();
    }
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
});

module.exports = app;
