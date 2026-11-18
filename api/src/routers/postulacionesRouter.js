const express = require('express');
const { PostulacionController } = require('../controllers/postulacionController.js');
const validar = require('../middlewares/validar.js');
const autenticar = require('../middlewares/autenticar.js');
const { roles } = require('../auth/models/usuario.js');
const {
    validarCreacionPostulacion,
    validarFiltrosPostulaciones,
    validarIdPostulacion,
    validarCambioEstado
} = require('../validators/postulacionesValidator.js');

const postulacionController = new PostulacionController();
const router = express.Router();

router.route('/')
    .get(
        autenticar([roles.COLABORADOR, roles.COLECTIVO, roles.ADMIN]),
        validar(validarFiltrosPostulaciones, 'query'),
        (req, res) => postulacionController.obtenerTodas(req, res)
    )
    .post(
        autenticar(roles.COLABORADOR),
        validar(validarCreacionPostulacion, 'body'),
        (req, res) => postulacionController.crear(req, res)
    );

router.route('/:id')
    .get(
        autenticar([roles.COLABORADOR, roles.COLECTIVO, roles.ADMIN]),
        validar(validarIdPostulacion, 'params'),
        (req, res) => postulacionController.obtenerPorId(req, res)
    );

router.route('/:id/estado')
    .patch(
        autenticar(roles.COLECTIVO),
        validar(validarIdPostulacion, 'params'),
        validar(validarCambioEstado, 'body'),
        (req, res) => postulacionController.actualizarEstado(req, res)
    );

module.exports = router;
