const express = require('express')
const { ColaboradorController } = require('../controllers/colaboradorController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
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
    .get((req, res) => colaboradorController.obtenerColaboradores(req, res))
    .post(
        autenticar(roles.COLABORADOR),
        validar(validarCreacionColaborador, 'body'),
        (req, res) => colaboradorController.crearColaborador(req, res)
    )

router.route('/:cuentaGit')
    .get(
        validar(validarCuentaGitColaborador, 'params'),
        (req, res) => colaboradorController.obtenerColaboradorPorCuentaGit(req, res)
    )

router.route('/:cuentaGit/anotarProyecto/:idProyecto')
    .post(
        validar(validarAnotacionAProyecto, 'params'),
        (req, res) => colaboradorController.anotarColaboradorAProyecto(req, res)
    )

router.route('/llenarDatosPrueba')
    .post((req, res) => colaboradorController.llenarDatosPrueba(req, res));

router.route('/:cuentaGit/buscarPotencialesProyectos')
    .get(
        validar(validarCuentaGitColaborador, 'params'),
        (req, res) => colaboradorController.buscarPotencialesProyectos(req, res)
    )

router.route('/:cuentaGit/notificaciones')
    .get(
        validar(validarCuentaGitColaborador, 'params'),
        (req, res) => colaboradorController.obtenerNotificaciones(req, res)
    )

module.exports = router
