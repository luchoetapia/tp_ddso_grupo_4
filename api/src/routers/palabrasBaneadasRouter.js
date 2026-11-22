const express = require('express')
const { PalabraBaneadaController } = require('../controllers/palabraBaneadaController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const {
    validarCreacionPalabraBaneada,
    validarListadoPalabrasBaneadas,
    validarIdsPalabraBaneada
} = require('../validators/palabrasBaneadasValidator.js')

const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('../auth/models/usuario.js')

const palabraBaneadaController = new PalabraBaneadaController()
const router = express.Router()

// Todos los endpoints son solo para admins
router.use(autenticar(roles.ADMIN))

router.route('/')
    .get(
        validar(validarListadoPalabrasBaneadas, 'query'),
        (req, res) => palabraBaneadaController.obtenerPalabras(req, res)
    )
    .post(
        validar(validarCreacionPalabraBaneada, 'body'),
        (req, res) => palabraBaneadaController.agregarPalabra(req, res)
    )

router.route('/:id/activar')
    .patch(
        validar(validarIdsPalabraBaneada, 'params'),
        (req, res) => palabraBaneadaController.activarPalabra(req, res)
    )

router.route('/:id/desactivar')
    .patch(
        validar(validarIdsPalabraBaneada, 'params'),
        (req, res) => palabraBaneadaController.desactivarPalabra(req, res)
    )

module.exports = router
