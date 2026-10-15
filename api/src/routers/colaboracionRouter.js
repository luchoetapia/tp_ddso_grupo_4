const express = require('express')
const { ColaboracionController } = require('../controllers/colaboracionController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const { validarCreacionColaboracion } = require('../validators/colaboracionValidator.js')

const colaboracionController = new ColaboracionController()
const router = express.Router()

router.route('/')
    .get((req, res) => colaboracionController.obtenerColaboraciones(req, res))
    .post(
        validar(validarCreacionColaboracion, 'body'),
        (req, res) => colaboracionController.crearColaboracion(req, res)
    )


module.exports = router
