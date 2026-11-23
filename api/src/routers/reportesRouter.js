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

const auditar = require('../middlewares/auditar.js')
const { AccionAuditada, TipoEntidadAuditada } = require('../models/Auditoria.js')
const { TipoEntidadReportada } = require('../models/Reporte.js')

const reporteController = new ReporteController()

// Datos para la auditoría: el reporte revisado y, si lo hay, el colectivo afectado
const revisionDeReporte = (req, body) => ({
    entidad: { tipo: TipoEntidadAuditada.REPORTE, id: req.params.id },
    idColectivo: body.entidad.tipo === TipoEntidadReportada.COLECTIVO ? body.entidad.id : null,
    idProyecto: body.entidad.tipo === TipoEntidadReportada.PROYECTO ? body.entidad.id : null,
    detalle: [`${body.entidad.tipo} ${body.entidad.id}`, req.body?.comentario && `Comentario: ${req.body.comentario}`]
        .filter(Boolean).join('. '),
})
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
        auditar(AccionAuditada.REPORTE_NOTIFICADO, revisionDeReporte),
        (req, res) => reporteController.notificarReporte(req, res)
    )

// Elimina la entidad reportada
router.route('/:id/validar')
    .patch(
        validar(validarIdsReporte, 'params'),
        validar(validarResolucionReporte, 'body'),
        auditar(AccionAuditada.REPORTE_VALIDADO, revisionDeReporte),
        (req, res) => reporteController.validarReporte(req, res)
    )

router.route('/:id/rechazar')
    .patch(
        validar(validarIdsReporte, 'params'),
        validar(validarResolucionReporte, 'body'),
        auditar(AccionAuditada.REPORTE_RECHAZADO, revisionDeReporte),
        (req, res) => reporteController.rechazarReporte(req, res)
    )

module.exports = router
