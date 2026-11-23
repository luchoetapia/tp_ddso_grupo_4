const express = require('express')
const { ColectivoController } = require('../controllers/colectivoController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('../auth/models/usuario.js')
const auditar = require('../middlewares/auditar.js')
const { AccionAuditada, TipoEntidadAuditada } = require('../models/Auditoria.js')
const { validarFiltrosAuditoriaColectivo } = require('../validators/auditoriaValidator.js')
const { AuditoriaController } = require('../controllers/auditoriaController.js')
const {
    validarCreacionColectivo,
    validarActualizacionColectivo,
    validarIdsColectivo,
    validarFiltrosColectivo,
    validarFiltrosPotencialesColaboradores,
    validarCreacionAdministrador,
    validarIdAdministrador,
} = require('../validators/colectivosValidator.js')

const colectivoController = new ColectivoController()
const auditoriaController = new AuditoriaController()

// Datos para la auditoría
const colectivoDeLaRespuesta = (req, body) => ({
    entidad: { tipo: TipoEntidadAuditada.COLECTIVO, id: body.data.id },
    idColectivo: body.data.id,
})
const colectivoDeLaSesion = (detalle) => (req, body, res) => ({
    entidad: { tipo: TipoEntidadAuditada.COLECTIVO, id: res.locals.idColectivo },
    idColectivo: res.locals.idColectivo,
    detalle: detalle(req, body, res),
})
const router = express.Router()

router.route('/')
    .get(
        validar(validarFiltrosColectivo, 'query'),
        (req, res) => colectivoController.obtenerColectivos(req, res)
    )
    .post(
        autenticar(roles.COLECTIVO),
        validar(validarCreacionColectivo, 'body'),
        auditar(AccionAuditada.COLECTIVO_CREADO, colectivoDeLaRespuesta),
        (req, res) => colectivoController.crearColectivo(req, res)
    );

router.route('/me')
    .get(
        autenticar(roles.COLECTIVO),
        (req, res) => colectivoController.obtenerMiColectivo(req, res)
    )
    .patch(
        autenticar(roles.COLECTIVO),
        validar(validarActualizacionColectivo, 'body'),
        auditar(AccionAuditada.COLECTIVO_ACTUALIZADO, (req, body) => ({
            ...colectivoDeLaRespuesta(req, body),
            detalle: `Campos modificados: ${Object.keys(req.body).join(', ')}`,
        })),
        (req, res) => colectivoController.actualizarMiColectivo(req, res)
    );

router.route('/me/administradores')
    .get(
        autenticar(roles.COLECTIVO),
        (req, res) => colectivoController.obtenerMisAdministradores(req, res)
    )
    .post(
        autenticar(roles.COLECTIVO),
        validar(validarCreacionAdministrador, 'body'),
        auditar(AccionAuditada.ADMINISTRADOR_AGREGADO, colectivoDeLaSesion((req, body) => `Cuenta: ${body.data.username}`)),
        (req, res) => colectivoController.agregarAdministrador(req, res)
    );

router.route('/me/administradores/:idUsuario')
    .delete(
        autenticar(roles.COLECTIVO),
        validar(validarIdAdministrador, 'params'),
        auditar(AccionAuditada.ADMINISTRADOR_QUITADO, colectivoDeLaSesion((req, body, res) => `Cuenta: ${res.locals.administrador?.username ?? req.params.idUsuario}`)),
        (req, res) => colectivoController.quitarAdministrador(req, res)
    );

router.route('/me/auditoria')
    .get(
        autenticar(roles.COLECTIVO),
        validar(validarFiltrosAuditoriaColectivo, 'query'),
        (req, res) => auditoriaController.obtenerAuditoriaDeMiColectivo(req, res)
    );

router.route('/me/estadisticas')
    .get(
        autenticar(roles.COLECTIVO),
        (req, res) => colectivoController.obtenerMisEstadisticas(req, res)
    );

router.route('/me/potencialesColaboradores')
    .get(
        autenticar(roles.COLECTIVO),
        validar(validarFiltrosPotencialesColaboradores, 'query'),
        (req, res) => colectivoController.obtenerMisPotencialesColaboradores(req, res)
    );

router.route('/:id')
    .get(
        validar(validarIdsColectivo, 'params'),
        (req, res) => colectivoController.obtenerColectivoPorId(req, res)
    )
    .delete(
        autenticar([roles.COLECTIVO, roles.ADMIN]),
        validar(validarIdsColectivo, 'params'),
        auditar(AccionAuditada.COLECTIVO_DADO_DE_BAJA, (req, body) => ({
            entidad: { tipo: TipoEntidadAuditada.COLECTIVO, id: req.params.id },
            idColectivo: req.params.id,
            detalle: body.mensaje,
        })),
        (req, res) => colectivoController.desactivarColectivo(req, res)
    );

router.route('/llenarDatosPrueba')
    .post(autenticar(roles.ADMIN), (req, res) => colectivoController.llenarDatosPrueba(req, res));

module.exports = router
