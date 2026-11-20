const express = require('express')
const { ColaboracionController } = require('../controllers/colaboracionController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const { validarListado } = require('../validators/comunes.js')
//const { validarCreacionColaboracion } = require('../validators/colaboracionValidator.js')

const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('../auth/models/usuario.js')
const { validarCreacionColaboracion, validarIdsColaboracion } = require('../validators/colaboracionValidator.js')

const colaboracionController = new ColaboracionController()
const router = express.Router()

router.route('/')
    .get(
        validar(validarListado, 'query'),
        (req, res) => colaboracionController.obtenerColaboraciones(req, res)
    )
    .post(
        validar(validarCreacionColaboracion, 'body'),
        (req, res) => colaboracionController.crearColaboracion(req, res)
    )

router.route("/proyecto/:id")
    .get(
        (req, res) => colaboracionController.obtenerColaboracionPorProyecto(req, res)
    )

router.route("/colaborador/:id")
    .get(
        (req, res) => colaboracionController.obtenerColaboracionPorColaborador(req, res)
    )

router.route('/:id/desanotar')
    .post(
        autenticar([roles.COLABORADOR, roles.COLECTIVO]),
        validar(validarIdsColaboracion, 'params'),
        (req, res) => colaboracionController.desanotarColaboracion(req, res)
    )


module.exports = router
