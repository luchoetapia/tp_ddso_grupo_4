const express = require('express');
const app = express();
const PORT = 3000;

const proyectosRouter = require('./routers/proyectosRouter.js');
const colectivosRouter = require('./routers/colectivosRouter.js');
const habilidadesRouter = require('./routers/habilidadesRouter.js');
const colaboradoresRouter = require('./routers/colaboradoresRouter.js');

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