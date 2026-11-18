const express = require('express')
const { ColectivoController } = require('../controllers/colectivoController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('../auth/models/usuario.js')
const { validarCreacionColectivo, validarActualizacionColectivo, validarIdsColectivo, validarFiltrosColectivo, validarFiltrosPotencialesColaboradores } = require('../validators/colectivosValidator.js')

const colectivoController = new ColectivoController()
const router = express.Router()

router.route('/')
    .get(
        validar(validarFiltrosColectivo, 'query'),
        (req, res) => colectivoController.obtenerColectivos(req, res)
    )
    .post(
        autenticar(roles.COLECTIVO),
        validar(validarCreacionColectivo, 'body'),
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
        (req, res) => colectivoController.actualizarMiColectivo(req, res)
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
        (req, res) => colectivoController.desactivarColectivo(req, res)
    );

router.route('/llenarDatosPrueba')
    .post(autenticar(roles.ADMIN), (req, res) => colectivoController.llenarDatosPrueba(req, res));

module.exports = router
