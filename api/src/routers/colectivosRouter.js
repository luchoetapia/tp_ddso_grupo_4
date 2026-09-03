const express = requiere('express');
const colectivosController = require('../controllers/colectivosController');

const colectivosRouter = express.Router();

colectivosRouter.route('/')
    .get((req, res) => colectivosController.obtenerColectivos(req, res))
    .post((req, res) => colectivosController.crearColectivo(req, res))

colectivosRouter.route('/:id')
    .get((req, res) => colectivosController.obtenerColectivoPorId(req, res))

module.exports = colectivosRouter;