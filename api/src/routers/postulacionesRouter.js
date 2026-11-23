const express = require('express');
const { PostulacionController } = require('../controllers/postulacionController.js');
const validar = require('../middlewares/validar.js');
const {
    validarCreacionPostulacion,
    validarFiltrosPostulaciones,
    validarIdPostulacion,
    validarCambioEstado
} = require('../validators/postulacionesValidator.js');

const auditar = require('../middlewares/auditar.js');
const { AccionAuditada, TipoEntidadAuditada } = require('../models/Auditoria.js');
const EstadoPostulacion = require('../models/Proyecto/Postulaciones/EstadoPostulacion.js');

const postulacionController = new PostulacionController();

const ACCION_POR_ESTADO = {
    [EstadoPostulacion.ACEPTADA]: AccionAuditada.POSTULACION_ACEPTADA,
    [EstadoPostulacion.RECHAZADA]: AccionAuditada.POSTULACION_RECHAZADA,
};

// Datos para la auditoría
const postulacionDeLaRespuesta = (detalle) => (req, body) => ({
    entidad: { tipo: TipoEntidadAuditada.POSTULACION, id: body.data.id },
    idProyecto: body.data.proyecto?.id,
    detalle: detalle(body.data),
});
const colaboradorDe = (postulacion) => postulacion.colaborador?.cuentaGit ?? postulacion.colaborador?.id;

const router = express.Router();

router.route('/')
    .get(
        validar(validarFiltrosPostulaciones, 'query'),
        (req, res) => postulacionController.obtenerTodas(req, res)
    )
    .post(
        validar(validarCreacionPostulacion, 'body'),
        auditar(AccionAuditada.POSTULACION_CREADA, postulacionDeLaRespuesta((p) => `Colaborador: ${colaboradorDe(p)}. Perfil: ${p.idPerfil}`)),
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
        auditar((req) => ACCION_POR_ESTADO[req.body.estado], postulacionDeLaRespuesta((p) => `Colaborador: ${colaboradorDe(p)}. Perfil: ${p.idPerfil}`)),
        (req, res) => postulacionController.actualizarEstado(req, res)
    );

module.exports = router;
