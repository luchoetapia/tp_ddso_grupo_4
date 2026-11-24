const express = require('express')
const { AuthController } = require('./authController.js')
const validar = require('../middlewares/validar.js')
const { validarLogin, validarRegistro, validarDisponibilidad } = require('./authValidator.js')
const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('./models/usuario.js')

const authController = new AuthController()
const router = express.Router()

router.post('/login',
    validar(validarLogin, 'body'),
    (req, res) => authController.login(req, res)
)

router.post('/registro',
    validar(validarRegistro, 'body'),
    (req, res) => authController.registro(req, res)
)

router.get('/validar',
    validar(validarDisponibilidad, 'query'),
    (req, res) => authController.validar(req, res)
)

router.post('/refresh',
    (req, res) => authController.refresh(req, res)
)

router.post('/logout',
    (req, res) => authController.logout(req, res)
)

// Ingreso con LinkedIn (solo colaboradores). Son navegaciones del navegador, no llamadas con Axios:
// el front pone un link a /api/auth/linkedin y LinkedIn vuelve a /api/auth/linkedin/callback
router.get('/linkedin',
    (req, res) => authController.linkedin(req, res)
)

// Vincular LinkedIn a la cuenta logueada (colaborador o colectivo) para publicar. También es una navegación
router.get('/linkedin/vincular',
    autenticar([roles.COLABORADOR, roles.COLECTIVO]),
    (req, res) => authController.vincular(req, res)
)

router.get('/linkedin/callback',
    (req, res) => authController.linkedinCallback(req, res)
)

router.get('/me',
    autenticar(),
    (req, res) => authController.me(req, res)
)

module.exports = router
