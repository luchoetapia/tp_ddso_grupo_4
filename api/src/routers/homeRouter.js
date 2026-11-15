const express = require('express')
const { HomeController } = require('../controllers/homeController.js')

const homeController = new HomeController()
const router = express.Router()

router.route('/contadores')
    .get((req, res) => homeController.obtenerContadores(req, res))

module.exports = router
