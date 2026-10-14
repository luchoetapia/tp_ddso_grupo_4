const express = require('express')
const { ProyectoController } = require('../controllers/proyectoController.js')

const proyectoController = new ProyectoController()
const router = express.Router()

router.route('/')
    .get((req, res) => proyectoController.obtenerProyectos(req, res))
    .post((req, res) => proyectoController.crearProyecto(req, res))

router.route('/llenarDatosPrueba')
    .post((req, res) => proyectoController.llenarDatosPrueba(req, res));


router.route('/:id')
    .get((req, res) => proyectoController.obtenerProyectoPorId(req, res))

router.route('/:id/finalizar')
    .post((req, res) => proyectoController.finalizarProyecto(req, res));

router.route('/:id/logros')
    .get((req, res) => proyectoController.obtenerLogrosDeUnProyecto(req, res))
    .post((req, res) => proyectoController.crearLogro(req, res))

router.route('/:id/logros/:idLogro')
    .get((req, res) => proyectoController.obtenerLogroPorId(req, res))
    .put((req, res) => proyectoController.actualizarLogro(req, res))
    .delete((req, res) => proyectoController.eliminarLogro(req, res))

module.exports = router
