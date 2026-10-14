const express = require('express')
const { LogroController } = require('../controllers/logroController.js')

const logroController = new LogroController()
const router = express.Router() 

router.route('/')
    .get((req, res) => logroController.obtenerLogros(req, res))
    .post((req, res) => logroController.crearLogro(req, res))

router.route('/:idLogro')
    .get((req, res) => logroController.obtenerLogroPorId(req, res))
    .put((req, res) => logroController.actualizarLogro(req, res))
    .delete((req, res) => logroController.eliminarLogro(req, res))

router.route('/llenarDatosPrueba')
    .post((req, res) => logroController.llenarDatosPrueba(req, res));

module.exports = router