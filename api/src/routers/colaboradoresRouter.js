const express = requiere('express');
const colaboradorasController = require('../controllers/colaboradoresController');

const colaboradoresRouter = express.Router();

colaboradoresRouter.route('/')
    .get((req, res) => colaboradorasController.obtenerColaboradoras(req, res))
    .post((req, res) => colaboradorasController.crearColaboradora(req, res))

colaboradoresRouter.route('/:cuentaGit')
    .get((req, res) => colaboradorasController.obtenerColaboradoraPorCuentaGit(req, res))

module.exports = colaboradoresRouter;