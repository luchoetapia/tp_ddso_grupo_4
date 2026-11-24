const express = require('express')
const { LinkedinController } = require('../controllers/linkedinController.js')

const validar = require('../middlewares/validar.js')
const { validarPublicacionLinkedin, validarPublicacionLogroLinkedin } = require('../validators/linkedinValidator.js')
const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('../auth/models/usuario.js')

const auditar = require('../middlewares/auditar.js')
const { AccionAuditada, TipoEntidadAuditada } = require('../models/Auditoria.js')

const linkedinController = new LinkedinController()
const router = express.Router()

// Un colaborador publica en su LinkedIn sobre un proyecto en el que colabora.
// Si no tiene LinkedIn vinculado (o el token venció) responde 403 con details [{ codigo: 'LINKEDIN_NO_VINCULADO' }]
router.post('/publicaciones',
    autenticar(roles.COLABORADOR),
    validar(validarPublicacionLinkedin, 'body'),
    auditar(AccionAuditada.PUBLICACION_LINKEDIN, (req, body) => ({
        entidad: { tipo: TipoEntidadAuditada.COLABORACION, id: body.data.colaboracionId },
        idProyecto: body.data.proyectoId,
        detalle: 'Publicó el proyecto en LinkedIn',
    })),
    (req, res) => linkedinController.publicar(req, res)
)

// Un colectivo (titular o administrador) publica en su LinkedIn un logro de uno de sus proyectos.
// Mismo 403 con LINKEDIN_NO_VINCULADO si tiene que conectar o reconectar LinkedIn
router.post('/publicaciones/logros',
    autenticar(roles.COLECTIVO),
    validar(validarPublicacionLogroLinkedin, 'body'),
    auditar(AccionAuditada.PUBLICACION_LINKEDIN, (req, body) => ({
        entidad: { tipo: TipoEntidadAuditada.PROYECTO, id: body.data.proyectoId },
        idColectivo: body.data.colectivoId,
        detalle: `Publicó el logro "${body.data.logroTitulo}" en LinkedIn`,
    })),
    (req, res) => linkedinController.publicarLogro(req, res)
)

module.exports = router
