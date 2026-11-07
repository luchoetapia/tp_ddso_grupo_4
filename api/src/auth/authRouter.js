const express = require('express')
const { AuthController } = require('./authController.js')

const authController = new AuthController()
const router = express.Router()

router.post('/login', (req, res) => authController.login(req, res))
router.post('/registro', (req, res) => authController.registro(req, res))

module.exports = router
