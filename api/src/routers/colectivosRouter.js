const express = require('express')
const { ColectivoController } = require('../controllers/colectivoController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const { validarCreacionColectivo, validarIdsColectivo } = require('../validators/colectivosValidator.js')

const colectivoController = new ColectivoController()
const router = express.Router()

router.route('/')
    .get((req, res) => colectivoController.obtenerColectivos(req, res))
    .post(
        validar(validarCreacionColectivo, 'body'),
        (req, res) => colectivoController.crearColectivo(req, res)
    )

router.route('/:id')
    .get(
        validar(validarIdsColectivo, 'params'),
        (req, res) => colectivoController.obtenerColectivoPorId(req, res)
    )
    .delete(
        validar(validarIdsColectivo, 'params'),
        (req, res) => colectivoController.desactivarColectivo(req, res)
    )

router.route('/llenarDatosPrueba')
    .post((req, res) => colectivoController.llenarDatosPrueba(req, res));

module.exports = router
