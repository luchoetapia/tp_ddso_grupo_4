const express = require('express')
const { HabilidadController } = require('../controllers/habilidadController.js')

// Import de validaciones
const validar = require('../middlewares/validar.js')
const { validarListado } = require('../validators/comunes.js')
const { validarCreacionHabilidad, validarIdsHabilidad } = require('../validators/habilidadesValidator.js')

const autenticar = require('../middlewares/autenticar.js')
const { roles } = require('../auth/models/usuario.js')

const habilidadController = new HabilidadController()
const router = express.Router()

router.route('/')
    .get(
        validar(validarListado, 'query'),
        (req, res) => habilidadController.obtenerHabilidades(req, res)
    )
    // Las habilidades las precarga el equipo administrativo
    .post(
        autenticar(roles.ADMIN),
        validar(validarCreacionHabilidad, 'body'),
        (req, res) => habilidadController.crearHabilidad(req, res)
    )

router.route('/:id')
    .get(
        validar(validarIdsHabilidad, 'params'),
        (req, res) => habilidadController.obtenerHabilidadPorId(req, res)
    )

router.route('/llenarDatosPrueba')
    .post(autenticar(roles.ADMIN), (req, res) => habilidadController.llenarDatosPrueba(req, res));

module.exports = router
