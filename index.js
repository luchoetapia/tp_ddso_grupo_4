const express = require('express');
const swaggerUi = require('swagger-ui-express');
const app = express();
const PORT = 3000;

const router = require("./api/src/routers/router.js");

const { swaggerSpec } = require('./api/src/swagger.js');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('¡Hola Mundo!');
});

app.use(router);

app.get("/healthcheck", (request, response) => {
    response.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
    })
})

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});