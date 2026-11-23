const express = require('express')
const { AuditoriaController } = require('../controllers/auditoriaController.js')

const validar = require('../middlewares/validar.js')
const { validarFiltrosAuditoria } = require('../validators/auditoriaValidator.js')

const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('../auth/models/usuario.js')

const auditoriaController = new AuditoriaController()
const router = express.Router()

// Historial completo: solo admins de la plataforma
router.route('/')
    .get(
        autenticar(roles.ADMIN),
        validar(validarFiltrosAuditoria, 'query'),
        (req, res) => auditoriaController.obtenerAuditoria(req, res)
    )

module.exports = router
