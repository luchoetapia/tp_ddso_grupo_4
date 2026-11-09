const express = require('express')
const { AuthController } = require('./authController.js')
const validar = require('../middlewares/validar.js')
const { validarLogin, validarRegistro } = require('./authValidator.js')
const autenticar = require('../middlewares/autenticar.js')

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

router.post('/refresh',
    (req, res) => authController.refresh(req, res)
)

router.post('/logout',
    (req, res) => authController.logout(req, res)
)

router.get('/me',
    autenticar(),
    (req, res) => authController.me(req, res)
)

module.exports = router
