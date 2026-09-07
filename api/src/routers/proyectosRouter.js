import express from "express"
import { ProyectoController } from "../controllers/proyectoController.js"

const proyectoController = new ProyectoController()
const router = express.Router()

router.route('/')
    .get((req, res) => proyectoController.obtenerProyectos(req, res))
    .post((req, res) => proyectoController.crearProyecto(req, res))


router.route('/:id')
    .get((req, res) => proyectoController.obtenerProyectoPorId(req, res))

export default router