const express = require('express');
const { PerfilController } = require('../controllers/perfilController.js');

const perfilController = new PerfilController();
const router = express.Router();

router.route('/')
    .get(perfilController.obtenerPerfiles)
    .post(perfilController.crearPerfil);

router.route('/llenarDatosPrueba')
    .post(perfilController.llenarDatosPrueba);

router.route('/:id')
    .get(perfilController.obtenerPerfilPorId)
    .put(perfilController.actualizarPerfil)
    .delete(perfilController.eliminarPerfil);

module.exports = router;