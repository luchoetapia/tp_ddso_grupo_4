const express = require('express')
const proyectosRouter = require('./proyectosRouter.js');
const colectivosRouter = require('./colectivosRouter.js');
const habilidadesRouter = require('./habilidadesRouter.js');
const colaboradoresRouter = require('./colaboradoresRouter.js');
const colaboracionRouter = require("./colaboracionRouter.js");
const authRouter = require('../auth/authRouter.js');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('../swagger.js');

const router = express.Router();

router.use('/proyectos', proyectosRouter);
router.use('/colectivos', colectivosRouter);
router.use('/habilidades', habilidadesRouter);
router.use('/colaboradores', colaboradoresRouter);
router.use('/colaboraciones', colaboracionRouter);
router.use('/auth', authRouter);
router.use('/api-documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = router