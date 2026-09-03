const express = require('express');
const proyectosController = require('../controllers/proyectosController');

const proyectosRouter = express.Router();

proyectosRouter.route('/')
    .get((req, res) => proyectosController.obtenerProyectos(req, res))
    .post((req, res) => proyectosController.crearProyecto(req, res))


proyectosRouter.route('/:id')
    .get((req, res) => proyectosController.obtenerProyectoPorId(req, res))

module.exports = proyectosRouter;