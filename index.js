const express = require('express');
const app = express();
const PORT = 3000;

const router = require("./api/src/routers/router.js");

app.use(express.json());
app.use(router);

app.get('/', (req, res) => {
  res.send('¡Hola Mundo!');
});

app.get("/healthcheck", (request, response) => {
    response.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
    })
})

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Error interno del servidor',
    details: err.details || [],
  });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});