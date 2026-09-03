const express = requiere('express');
const colectivosController = require('../controllers/colectivosController');

const router = express.Router();

router.route('/')
    .get((req, res) => colectivosController.obtenerColectivos(req, res))
    .post((req, res) => colectivosController.crearColectivo(req, res))

router.route('/:id')
    .get((req, res) => colectivosController.obtenerColectivoPorId(req, res))