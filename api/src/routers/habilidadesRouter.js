const express = require('express')
const { HabilidadController } = require('../controllers/habilidadController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const { validarCreacionHabilidad, validarIdsHabilidad } = require('../validators/habilidadesValidator.js')

const habilidadController = new HabilidadController()
const router = express.Router()

router.route('/')
    .get((req, res) => habilidadController.obtenerHabilidades(req, res))
    .post(
        validar(validarCreacionHabilidad, 'body'),
        (req, res) => habilidadController.crearHabilidad(req, res)
    )

router.route('/:id')
    .get(
        validar(validarIdsHabilidad, 'params'),
        (req, res) => habilidadController.obtenerHabilidadPorId(req, res)
    )

router.route('/llenarDatosPrueba')
    .post((req, res) => habilidadController.llenarDatosPrueba(req, res));

module.exports = router
