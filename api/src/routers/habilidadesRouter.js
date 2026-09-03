const express = requiere('express');
const habilidadesController = require('../controllers/habilidadesController');

const habilidadesRouter = express.Router();

habilidadesRouter.route('/')
    .get((req, res) => habilidadesController.obtenerHabilidades(req, res))
    .post((req, res) => habilidadesController.crearHabilidad(req, res))


habilidadesRouter.route('/:id')
    .get((req, res) => habilidadesController.obtenerHabilidadPorId(req, res))

module.exports = habilidadesRouter;