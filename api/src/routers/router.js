const express = require('express')
const proyectosRouter = require('./proyectosRouter.js');
const colectivosRouter = require('./colectivosRouter.js');
const habilidadesRouter = require('./habilidadesRouter.js');
const colaboradoresRouter = require('./colaboradoresRouter.js');
const colaboracionRouter = require("./colaboracionRouter.js");
const homeRouter = require('./homeRouter.js');
const postulacionesRouter = require("./postulacionesRouter.js");
const palabrasBaneadasRouter = require('./palabrasBaneadasRouter.js');
const reportesRouter = require('./reportesRouter.js');
const auditoriaRouter = require('./auditoriaRouter.js');
const linkedinRouter = require('./linkedinRouter.js');
const notificacionesRouter = require('./notificacionesRouter.js');
const authRouter = require('../auth/authRouter.js');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('../swagger.js');

const router = express.Router();

router.use('/proyectos', proyectosRouter);
router.use('/colectivos', colectivosRouter);
router.use('/habilidades', habilidadesRouter);
router.use('/colaboradores', colaboradoresRouter);
router.use('/colaboraciones', colaboracionRouter);
router.use('/home', homeRouter);
router.use('/postulaciones', postulacionesRouter);
router.use('/palabrasBaneadas', palabrasBaneadasRouter);
router.use('/reportes', reportesRouter);
router.use('/auditoria', auditoriaRouter);
router.use('/linkedin', linkedinRouter);
router.use('/notificaciones', notificacionesRouter);
router.use('/auth', authRouter);
router.use('/api-documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = router