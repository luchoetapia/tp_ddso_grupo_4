const express = require('express');
const app = express();
const PORT = 3000;

const proyectosRouter = require('./src/routers/proyectosRouter.js');
const colectivosRouter = require('./src/routers/colectivosRouter.js');
const habilidadesRouter = require('./src/routers/habilidadesRouter.js');
const colaboradoresRouter = require('./src/routers/colaboradoresRouter.js');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('¡Hola Mundo!');
});

app.use('/proyectos', proyectosRouter);
app.use('/colectivos', colectivosRouter);
app.use('/habilidades', habilidadesRouter);
app.use('/colaboradores', colaboradoresRouter);

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});