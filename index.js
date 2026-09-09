const express = require('express');
const swaggerUi = require('swagger-ui-express');
const app = express();
const PORT = 3000;

const proyectosRouter = require('./api/src/routers/proyectosRouter.js');
const colectivosRouter = require('./api/src/routers/colectivosRouter.js');
const habilidadesRouter = require('./api/src/routers/habilidadesRouter.js');
const colaboradoresRouter = require('./api/src/routers/colaboradoresRouter.js');
const { swaggerSpec } = require('./api/src/swagger.js');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('¡Hola Mundo!');
});

app.use('/api-documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/proyectos', proyectosRouter.router);
app.use('/colectivos', colectivosRouter);
app.use('/habilidades', habilidadesRouter);
app.use('/colaboradores', colaboradoresRouter);

app.get("/healthcheck", (request, response) => {
    response.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
    })
})

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});