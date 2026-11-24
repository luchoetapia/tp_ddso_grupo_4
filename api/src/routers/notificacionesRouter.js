const express = require('express')
const autenticar = require('../middlewares/autenticar.js')
const notificacionService = require('../services/notificacionService.js')
const { NotificacionPublic } = require('../dtos/notificacionPublic.js')

const router = express.Router()

// Mensajes internos del usuario de la sesión: colaboradores, colectivos (titular y administradores) y admins
router.route('/me')
    .get(
        autenticar(),
        async (req, res) => {
            const notificaciones = await notificacionService.obtenerPropias(req.usuario)
            res.status(200).json(notificaciones.map(NotificacionPublic.desde))
        }
    )

module.exports = router
