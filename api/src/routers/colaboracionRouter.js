const express = require('express')
const { ColaboracionController } = require('../controllers/colaboracionController.js')

const colaboracionController = new ColaboracionController()
const router = express.Router()

router.route('/')
    .get((req, res) => colaboracionController.obtenerColaboraciones(req, res))
    .post((req, res) => colaboracionController.crearColaboracion(req, res))


module.exports = router
