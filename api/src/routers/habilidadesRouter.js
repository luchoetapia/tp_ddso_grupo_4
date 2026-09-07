import express from "express"
import { HabilidadController } from "../controllers/habilidadController.js"

const habilidadController = new HabilidadController()
const router = express.Router()

router.route('/')
    .get((req, res) => habilidadController.obtenerHabilidades(req, res))
    .post((req, res) => habilidadController.crearHabilidad(req, res))


router.route('/:id')
    .get((req, res) => habilidadController.obtenerHabilidadPorId(req, res))

export default router