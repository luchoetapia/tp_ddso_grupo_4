const express = require('express')
const { ColectivoController } = require('../controllers/colectivoController.js')

const colectivoController = new ColectivoController()
const router = express.Router()

router.route('/')
    .get((req, res) => colectivoController.obtenerColectivos(req, res))
    .post((req, res) => colectivoController.crearColectivo(req, res))

router.route('/:id')
    .get((req, res) => colectivoController.obtenerColectivoPorId(req, res))

router.route('/seed')
    .post((req, res) => colectivoController.seed(req, res));

module.exports = router
