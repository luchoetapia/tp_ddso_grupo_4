import express from "express"
import { ColaboradorController } from "../controllers/colaboradorController.js"

const colaboradorController = new ColaboradorController()
const router = express.Router()

router.route('/')
    .get((req, res) => colaboradorController.obtenerColaboradores(req, res))
    .post((req, res) => colaboradorController.crearColaborador(req, res))

router.route('/:cuentaGit')
    .get((req, res) => colaboradorController.obtenerColaboradorPorCuentaGit(req, res))

export default router