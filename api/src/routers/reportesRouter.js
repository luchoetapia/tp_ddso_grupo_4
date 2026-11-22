const express = require('express')
const { ReporteController } = require('../controllers/reporteController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const {
    validarListadoReportes,
    validarResolucionReporte,
    validarIdsReporte
} = require('../validators/reportesValidator.js')

const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('../auth/models/usuario.js')

const reporteController = new ReporteController()
const router = express.Router()

// Todos los endpoints son solo para admins
router.use(autenticar(roles.ADMIN))

router.route('/')
    .get(
        validar(validarListadoReportes, 'query'),
        (req, res) => reporteController.obtenerReportes(req, res)
    )

router.route('/:id')
    .get(
        validar(validarIdsReporte, 'params'),
        (req, res) => reporteController.obtenerReportePorId(req, res)
    )

router.route('/:id/notificar')
    .patch(
        validar(validarIdsReporte, 'params'),
        (req, res) => reporteController.notificarReporte(req, res)
    )

// Elimina la entidad reportada
router.route('/:id/validar')
    .patch(
        validar(validarIdsReporte, 'params'),
        validar(validarResolucionReporte, 'body'),
        (req, res) => reporteController.validarReporte(req, res)
    )

router.route('/:id/rechazar')
    .patch(
        validar(validarIdsReporte, 'params'),
        validar(validarResolucionReporte, 'body'),
        (req, res) => reporteController.rechazarReporte(req, res)
    )

module.exports = router
