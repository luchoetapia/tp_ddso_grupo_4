const express = require('express')
const { ProyectoController } = require('../controllers/proyectoController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const { validarCreacionLogro, validarActualizacionLogro, validarIdsLogro } = require('../validators/logrosValidator.js')
const { validarIdsProyecto } = require('../validators/proyectosValidator.js')

const proyectoController = new ProyectoController()
const router = express.Router()

router.route('/')
    .get((req, res) => proyectoController.obtenerProyectos(req, res))
    .post((req, res) => proyectoController.crearProyecto(req, res));

router.route('/llenarDatosPrueba')
    .post((req, res) => proyectoController.llenarDatosPrueba(req, res));


router.route('/:id')
    .get((req, res) => proyectoController.obtenerProyectoPorId(req, res));

router.route('/:id/finalizar')
    .post((req, res) => proyectoController.finalizarProyecto(req, res));

router.route('/:id/logros')
    .get(
        validar(validarIdsProyecto, 'params'),
        (req, res) => proyectoController.obtenerLogrosDeUnProyecto(req, res)
    )
    .post(
        validar(validarCreacionLogro, 'body'),
        (req, res) => proyectoController.crearLogro(req, res)
    );

router.route('/:id/logros/:idLogro')
    .get(
        validar(validarIdsLogro, 'params'),
        (req, res) => proyectoController.obtenerLogroPorId(req, res)
    )
    .put(
        validar(validarIdsLogro, 'params'),
        validar(validarActualizacionLogro, 'body'),
        (req, res) => proyectoController.actualizarLogro(req, res)
    )
    .delete(
        validar(validarIdsLogro, 'params'),
        (req, res) => proyectoController.eliminarLogro(req, res)
    );

module.exports = router
