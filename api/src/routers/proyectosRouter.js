const express = require('express')
const { ProyectoController } = require('../controllers/proyectoController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const { validarListado } = require('../validators/comunes.js')
const { validarCreacionLogro, validarActualizacionLogro, validarIdsLogro } = require('../validators/logrosValidator.js')
const {
    validarCreacionProyecto,
    validarActualizacionProyecto,
    validarFiltrosProyecto,
    validarContactoColaborador,
    validarIdsProyecto,
    validarIdsPerfilDeProyecto,
    validarCreacionPerfil,
    validarActualizacionPerfil,
} = require('../validators/proyectosValidator.js')

const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('../auth/models/usuario.js')

const proyectoController = new ProyectoController()
const router = express.Router()

router.route('/')
    .get(
        validar(validarFiltrosProyecto, 'query'),
        (req, res) => proyectoController.obtenerProyectos(req, res)
    )
    .post(
        autenticar(roles.COLECTIVO),
        validar(validarCreacionProyecto, 'body'),
        (req, res) => proyectoController.crearProyecto(req, res)
    );

router.route('/llenarDatosPrueba')
    .post(autenticar(roles.ADMIN), (req, res) => proyectoController.llenarDatosPrueba(req, res));

router.route('/:id')
    .get(
        validar(validarIdsProyecto, 'params'),
        (req, res) => proyectoController.obtenerProyectoPorId(req, res)
    )
    .patch(
        autenticar(roles.COLECTIVO),
        validar(validarIdsProyecto, 'params'),
        validar(validarActualizacionProyecto, 'body'),
        (req, res) => proyectoController.actualizarProyecto(req, res)
    );

router.route('/:id/finalizar')
    .post(
        autenticar(roles.COLECTIVO),
        validar(validarIdsProyecto, 'params'),
        (req, res) => proyectoController.finalizarProyecto(req, res)
    );

router.route('/:id/perfiles')
    .get(
        validar(validarIdsProyecto, 'params'),
        (req, res) => proyectoController.obtenerPerfilesDeUnProyecto(req, res)
    )
    .post(
        autenticar(roles.COLECTIVO),
        validar(validarIdsProyecto, 'params'),
        validar(validarCreacionPerfil, 'body'),
        (req, res) => proyectoController.crearPerfil(req, res)
    );

router.route('/:id/perfiles/:idPerfil')
    .get(
        validar(validarIdsPerfilDeProyecto, 'params'),
        (req, res) => proyectoController.obtenerPerfilPorId(req, res)
    )
    .put(
        autenticar(roles.COLECTIVO),
        validar(validarIdsPerfilDeProyecto, 'params'),
        validar(validarActualizacionPerfil, 'body'),
        (req, res) => proyectoController.actualizarPerfil(req, res)
    )
    .delete(
        autenticar(roles.COLECTIVO),
        validar(validarIdsPerfilDeProyecto, 'params'),
        (req, res) => proyectoController.eliminarPerfil(req, res)
    );

router.route('/:id/perfiles/:idPerfil/buscarPotencialesColaboradores')
    .get(
        autenticar(roles.COLECTIVO),
        validar(validarIdsPerfilDeProyecto, 'params'),
        validar(validarListado, 'query'),
        (req, res) => proyectoController.buscarPotencialesColaboradores(req, res)
    );

router.route('/:id/perfiles/:idPerfil/contactarColaborador')
    .post(
        autenticar(roles.COLECTIVO),
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
        autenticar(roles.COLECTIVO),
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
        autenticar(roles.COLECTIVO),
        validar(validarIdsLogro, 'params'),
        validar(validarActualizacionLogro, 'body'),
        (req, res) => proyectoController.actualizarLogro(req, res)
    )
    .delete(
        autenticar(roles.COLECTIVO),
        validar(validarIdsLogro, 'params'),
        (req, res) => proyectoController.eliminarLogro(req, res)
    );

module.exports = router
