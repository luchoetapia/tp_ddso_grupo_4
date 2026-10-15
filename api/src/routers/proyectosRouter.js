const express = require('express')
const { ProyectoController } = require('../controllers/proyectoController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const { validarCreacionLogro, validarActualizacionLogro, validarIdsLogro } = require('../validators/logrosValidator.js')
const {
    validarCreacionProyecto,
    validarFinalizacionProyecto,
    validarContactoColaborador,
    validarIdsProyecto,
    validarIdsPerfilDeProyecto,
} = require('../validators/proyectosValidator.js')

const proyectoController = new ProyectoController()
const router = express.Router()

router.route('/')
    .get((req, res) => proyectoController.obtenerProyectos(req, res))
    .post(
        validar(validarCreacionProyecto, 'body'),
        (req, res) => proyectoController.crearProyecto(req, res)
    );

router.route('/llenarDatosPrueba')
    .post((req, res) => proyectoController.llenarDatosPrueba(req, res));

router.route('/:id')
    .get(
        validar(validarIdsProyecto, 'params'),
        (req, res) => proyectoController.obtenerProyectoPorId(req, res)
    );

router.route('/:id/finalizar')
    .post(
        validar(validarIdsProyecto, 'params'),
        validar(validarFinalizacionProyecto, 'body'),
        (req, res) => proyectoController.finalizarProyecto(req, res)
    );

router.route('/:id/perfiles/:idPerfil/buscarPotencialesColaboradores')
    .get(
        validar(validarIdsPerfilDeProyecto, 'params'),
        (req, res) => proyectoController.buscarPotencialesColaboradores(req, res)
    );

router.route('/:id/perfiles/:idPerfil/contactarColaborador')
    .post(
        validar(validarIdsPerfilDeProyecto, 'params'),
        validar(validarContactoColaborador, 'body'),
        (req, res) => proyectoController.contactarColaborador(req, res)
    );

router.route('/:id/logros')
    .get(
        validar(validarIdsProyecto, 'params'),
        (req, res) => proyectoController.obtenerLogrosDeUnProyecto(req, res)
    )
    .post(
        validar(validarIdsProyecto, 'params'),
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
