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

// Anotación directa (1ª entrega): desde las postulaciones solo la usa el equipo administrativo
router.route('/:cuentaGit/anotarProyecto/:idProyecto')
    .post(
        autenticar(roles.ADMIN),
        validar(validarAnotacionAProyecto, 'params'),
        (req, res) => colaboradorController.anotarColaboradorAProyecto(req, res)
    )

router.route('/llenarDatosPrueba')
    .post(autenticar(roles.ADMIN), (req, res) => colaboradorController.llenarDatosPrueba(req, res));

router.route('/:cuentaGit/buscarPotencialesProyectos')
    .get(
        autenticar([roles.COLABORADOR, roles.ADMIN]),
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
