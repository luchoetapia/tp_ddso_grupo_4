import express from "express"
import { ColectivoController } from "../controllers/colectivoController.js"

const colectivoController = new ColectivoController()
const router = express.Router()

router.route('/')
    .get((req, res) => colectivoController.obtenerColectivos(req, res))
    .post((req, res) => colectivoController.crearColectivo(req, res))

router.route('/:id')
    .get((req, res) => colectivoController.obtenerColectivoPorId(req, res))

export default router