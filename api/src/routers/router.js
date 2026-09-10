const express = require('express')
const proyectosRouter = require('./proyectosRouter.js');
const colectivosRouter = require('./colectivosRouter.js');
const habilidadesRouter = require('./habilidadesRouter.js');
const colaboradoresRouter = require('./colaboradoresRouter.js');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec, swaggerOptions } = require('../swagger.js');

const router = express.Router();

router.use('/proyectos', proyectosRouter);
router.use('/colectivos', colectivosRouter);
router.use('/habilidades', habilidadesRouter);
router.use('/colaboradores', colaboradoresRouter);
router.use('/api-documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

module.exports = router