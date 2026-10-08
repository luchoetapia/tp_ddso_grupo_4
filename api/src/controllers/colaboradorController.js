const { z } = require('zod');
const colaboradorService = require('../services/colaboradorService.js');
const { BadRequestError } = require('../errors/AppError.js');

const colaboradorSchema = z.object({
    id: z.int().positive(),
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    nombreFantasia: z.string().optional(),
    cuentaGit: z.string().min(1),
    habilidades: z.array(z.number().int().positive()).default([]),
    pronombres: z.string().optional(),
    presentacion: z.string().max(300).optional(),
}).strict()

class ColaboradorController {
    constructor() {
        this.colaboradorService = colaboradorService;
    }

    obtenerColaboradores = (req, res) => {
        const colaboradores = this.colaboradorRepository.findAll();
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
        /* Excepcion ya manejada por colaboradorService
        if (!colaborador) {
            return res.status(404).json({ message: 'Colaboradora no encontrada' })
        }
        */
        const colaboracion = this.colaboradorService.anotarAProyecto(colaborador, parseInt(idProyecto, 10))
        res.status(200).json({ message: 'Colaboradora anotada al proyecto exitosamente', data: colaboracion })
    }

    seed = (req, res) => {
        const COLABORADORES_INICIALES = [
            {
                nombre: "Juan",
                apellido: "Pérez",
                nombreFantasia: "Juani",
                cuentaGit: "juanperez",
                habilidades: [1, 2],
                pronombres: "Él",
                presentacion: "Desarrollador backend apasionado por Node.js"
            },
            {
                nombre: "María",
                apellido: "Gómez",
                nombreFantasia: "Mari",
                cuentaGit: "mariagomez",
                habilidades: [2],
                pronombres: "Ella",
                presentacion: "Frontend dev y diseñadora UX"
            }
        ];

        const lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : COLABORADORES_INICIALES;
    
        const creados = lista.map(datos => this.colaboradorService.crear(datos));

        return res.status(201).json({ status: "success", data: creados });
    }
}

module.exports = { ColaboradorController };
