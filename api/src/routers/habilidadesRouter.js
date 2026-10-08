const express = require('express')
const { HabilidadController } = require('../controllers/habilidadController.js')

const habilidadController = new HabilidadController()
const router = express.Router()

router.route('/')
    .get((req, res) => habilidadController.obtenerHabilidades(req, res))
    .post((req, res) => habilidadController.crearHabilidad(req, res))

router.route('/:id')
    .get((req, res) => habilidadController.obtenerHabilidadPorId(req, res))

router.route('/seed')
    .post((req, res) => habilidadController.seed(req, res));

module.exports = router
