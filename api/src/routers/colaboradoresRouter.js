const express = require('express')
const { ColaboradorController } = require('../controllers/colaboradorController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const { validarListado } = require('../validators/comunes.js')
const { validarFiltrosProyecto } = require('../validators/proyectosValidator.js')
const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('../auth/models/usuario.js')
const {
    validarCreacionColaborador,
    validarCuentaGitColaborador,
    validarAnotacionAProyecto,
} = require('../validators/colaboradoresValidator.js')

const auditar = require('../middlewares/auditar.js')
const { AccionAuditada, TipoEntidadAuditada } = require('../models/Auditoria.js')

const colaboradorController = new ColaboradorController()
const router = express.Router()

router.route('/')
    .get(
        validar(validarListado, 'query'),
        (req, res) => colaboradorController.obtenerColaboradores(req, res)
    )
    .post(
        autenticar(roles.COLABORADOR),
        validar(validarCreacionColaborador, 'body'),
        (req, res) => colaboradorController.crearColaborador(req, res)
    )

router.route('/me')
    .get(
        autenticar(roles.COLABORADOR),
        (req, res) => colaboradorController.obtenerMiPerfil(req, res)
    )

router.route('/:cuentaGit')
    .get(
        validar(validarCuentaGitColaborador, 'params'),
        (req, res) => colaboradorController.obtenerColaboradorPorCuentaGit(req, res)
    )

router.route('/:cuentaGit/contactos')
    .get(
        autenticar(),
        validar(validarCuentaGitColaborador, 'params'),
        (req, res) => colaboradorController.obtenerContactosColaborador(req, res)
    )

router.route('/:cuentaGit/anotarProyecto/:idProyecto')
    .post(
        validar(validarAnotacionAProyecto, 'params'),
        auditar(AccionAuditada.COLABORACION_CREADA, (req, body) => ({
            entidad: { tipo: TipoEntidadAuditada.COLABORACION, id: body.data.id },
            idProyecto: req.params.idProyecto,
            detalle: `Anotación directa de: ${req.params.cuentaGit}`,
        })),
        (req, res) => colaboradorController.anotarColaboradorAProyecto(req, res)
    )

router.route('/llenarDatosPrueba')
    .post((req, res) => colaboradorController.llenarDatosPrueba(req, res));

router.route('/:cuentaGit/buscarPotencialesProyectos')
    .get(
        validar(validarCuentaGitColaborador, 'params'),
        validar(validarFiltrosProyecto, 'query'),
        (req, res) => colaboradorController.buscarPotencialesProyectos(req, res)
    )

router.route('/me/notificaciones')
    .get(
        autenticar(roles.COLABORADOR),
        (req, res) => colaboradorController.obtenerMisNotificaciones(req, res)
    )

module.exports = router
