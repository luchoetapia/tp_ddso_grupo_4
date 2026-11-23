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
    validarFinalizacionProyecto,
    validarContactoColaborador,
    validarIdsProyecto,
    validarIdsPerfilDeProyecto,
    validarCreacionPerfil,
    validarActualizacionPerfil,
} = require('../validators/proyectosValidator.js')

const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('../auth/models/usuario.js')
const auditar = require('../middlewares/auditar.js')
const { AccionAuditada, TipoEntidadAuditada } = require('../models/Auditoria.js')

const proyectoController = new ProyectoController()
const router = express.Router()

// Datos para la auditoría
const proyecto = (id, detalle = null) => ({ entidad: { tipo: TipoEntidadAuditada.PROYECTO, id }, idProyecto: id, detalle })
const proyectoDeLaRuta = (detalle = () => null) => (req, body) => proyecto(req.params.id, detalle(req, body))
const camposModificados = (req) => `Campos modificados: ${Object.keys(req.body).join(', ')}`

router.route('/')
    .get(
        validar(validarFiltrosProyecto, 'query'),
        (req, res) => proyectoController.obtenerProyectos(req, res)
    )
    .post(
        autenticar(roles.COLECTIVO),
        validar(validarCreacionProyecto, 'body'),
        auditar(AccionAuditada.PROYECTO_CREADO, (req, body) => proyecto(body.data.id, `Título: ${body.data.titulo}`)),
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
        auditar(AccionAuditada.PROYECTO_ACTUALIZADO, proyectoDeLaRuta(camposModificados)),
        (req, res) => proyectoController.actualizarProyecto(req, res)
    );

router.route('/:id/finalizar')
    .post(
        autenticar(roles.COLECTIVO),
        validar(validarIdsProyecto, 'params'),
        validar(validarFinalizacionProyecto, 'body'),
        auditar(AccionAuditada.PROYECTO_FINALIZADO, proyectoDeLaRuta()),
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
        auditar(AccionAuditada.PERFIL_CREADO, proyectoDeLaRuta((req, body) => `Perfil: ${body.data.titulo} (${body.data.id})`)),
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
        auditar(AccionAuditada.PERFIL_ACTUALIZADO, proyectoDeLaRuta((req, body) => `Perfil: ${body.data.titulo} (${req.params.idPerfil}). ${camposModificados(req)}`)),
        (req, res) => proyectoController.actualizarPerfil(req, res)
    )
    .delete(
        autenticar(roles.COLECTIVO),
        validar(validarIdsPerfilDeProyecto, 'params'),
        auditar(AccionAuditada.PERFIL_ELIMINADO, proyectoDeLaRuta((req) => `Perfil: ${req.params.idPerfil}`)),
        (req, res) => proyectoController.eliminarPerfil(req, res)
    );

router.route('/:id/perfiles/:idPerfil/buscarPotencialesColaboradores')
    .get(
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
        auditar(AccionAuditada.LOGRO_CREADO, proyectoDeLaRuta((req, body) => `Logro: ${body.data.titulo} (${body.data.id})`)),
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
        auditar(AccionAuditada.LOGRO_ACTUALIZADO, proyectoDeLaRuta((req, body) => `Logro: ${body.data.titulo} (${req.params.idLogro}). ${camposModificados(req)}`)),
        (req, res) => proyectoController.actualizarLogro(req, res)
    )
    .delete(
        autenticar(roles.COLECTIVO),
        validar(validarIdsLogro, 'params'),
        auditar(AccionAuditada.LOGRO_ELIMINADO, proyectoDeLaRuta((req) => `Logro: ${req.params.idLogro}`)),
        (req, res) => proyectoController.eliminarLogro(req, res)
    );

module.exports = router
