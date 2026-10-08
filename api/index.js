const { notFoundHandler } = require("./src/middlewares/notFoundHandler.js");
const { errorLogger } = require("./src/middlewares/errorLogger.js");
const { errorHandler } = require("./src/middlewares/errorHandler.js");

const express = require('express');
const app = express();
const PORT = 3000;

const router = require("./src/routers/router.js");

app.use(express.json());
app.use(router);
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('¡Hola Mundo!');
});

app.get("/healthcheck", (request, response) => {
    response.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
    })
})

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});

module.exports = app;
