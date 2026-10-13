const express = require('express')
const { ColaboradorController } = require('../controllers/colaboradorController.js')

const colaboradorController = new ColaboradorController()
const router = express.Router()

router.route('/')
    .get((req, res) => colaboradorController.obtenerColaboradores(req, res))
    .post((req, res) => colaboradorController.crearColaborador(req, res))

router.route('/:cuentaGit')
    .get((req, res) => colaboradorController.obtenerColaboradorPorCuentaGit(req, res))

router.route('/:cuentaGit/anotarProyecto/:idProyecto')
    .post((req, res) => colaboradorController.anotarColaboradorAProyecto(req, res))

router.route('/llenarDatosPrueba')
    .post((req, res) => colaboradorController.llenarDatosPrueba(req, res));

module.exports = router
