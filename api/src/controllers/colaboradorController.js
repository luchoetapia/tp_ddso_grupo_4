const { z } = require('zod');
const { ColaboradorService } = require('../services/colaboradorService.js');
const { BadRequestError } = require('../errors/AppError.js');

const colaboradorSchema = z.object({
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    nombreFantasia: z.string().optional(),
    cuentaGit: z.string().min(1),
    habilidades: z.array(z.number().int().positive()).default([]),
    pronombres: z.string().optional(),
    presentacion: z.string().max(300).optional(),
}).strict()

class ColaboradorController {
    constructor(colaboradorService = new ColaboradorService()) {
        this.colaboradorService = colaboradorService;
    }

    obtenerColaboradores = (req, res) => {
        const colaboradores = this.colaboradorService.obtenerTodos()
        res.status(200).json(colaboradores)
    }

    crearColaborador = (req, res) => {
        const resultado = colaboradorSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }

        const colaboradoraNueva = this.colaboradorService.crear(resultado.data)
        res.status(201).json({ message: 'Colaboradora creada exitosamente', data: colaboradoraNueva })
    }

    obtenerColaboradorPorCuentaGit = (req, res) => {
        const { cuentaGit } = req.params
        const colaborador = this.colaboradorService.obtenerPorCuentaGit(cuentaGit)
        if (!colaborador) {
            return res.status(404).json({ message: 'Colaboradora no encontrada' })
        }
        res.status(200).json(colaborador)
    }
    anotarColaboradorAProyecto = (req, res) => {
        const { cuentaGit, idProyecto } = req.params;
        const colaborador = this.colaboradorService.obtenerPorCuentaGit(cuentaGit)
        if (!colaborador) {
            return res.status(404).json({ message: 'Colaboradora no encontrada' })
        }
        const colaboracion = this.colaboradorService.anotarAProyecto(colaborador, parseInt(idProyecto, 10))
        res.status(200).json({ message: 'Colaboradora anotada al proyecto exitosamente', data: colaboracion })
    }
}

module.exports = { ColaboradorController };
