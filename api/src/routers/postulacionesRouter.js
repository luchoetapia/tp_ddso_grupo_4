const express = require('express');
const { PostulacionController } = require('../controllers/postulacionController.js');
const validar = require('../middlewares/validar.js');
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
        validar(validarFiltrosPostulaciones, 'query'),
        (req, res) => postulacionController.obtenerTodas(req, res)
    )
    .post(
        validar(validarCreacionPostulacion, 'body'),
        (req, res) => postulacionController.crear(req, res)
    );

router.route('/:id')
    .get(
        validar(validarIdPostulacion, 'params'),
        (req, res) => postulacionController.obtenerPorId(req, res)
    );

router.route('/:id/estado')
    .patch(
        validar(validarIdPostulacion, 'params'),
        validar(validarCambioEstado, 'body'),
        (req, res) => postulacionController.actualizarEstado(req, res)
    );

module.exports = router;
