const express = require('express');
const { PerfilController } = require('../controllers/perfilController.js');

// Import de validaciones
const validar = require('../middlewares/validar.js');
const { validarCreacionPerfil, validarActualizacionPerfil, validarIdsPerfil } = require('../validators/perfilesValidator.js');

const perfilController = new PerfilController();
const router = express.Router();

router.route('/')
    .get(perfilController.obtenerPerfiles)
    .post(
        validar(validarCreacionPerfil, 'body'),
        perfilController.crearPerfil
    );

router.route('/llenarDatosPrueba')
    .post(perfilController.llenarDatosPrueba);

router.route('/:id')
    .get(
        validar(validarIdsPerfil, 'params'),
        perfilController.obtenerPerfilPorId
    )
    .put(
        validar(validarIdsPerfil, 'params'),
        validar(validarActualizacionPerfil, 'body'),
        perfilController.actualizarPerfil
    )
    .delete(
        validar(validarIdsPerfil, 'params'),
        perfilController.eliminarPerfil
    );

module.exports = router;