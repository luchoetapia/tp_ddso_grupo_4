const express = require('express')
const { AuthController } = require('./authController.js')
const validar = require('../middlewares/validar.js')
const { validarLogin, validarRegistro } = require('./authValidator.js')

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

module.exports = router
