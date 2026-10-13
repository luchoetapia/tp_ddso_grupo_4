const { z } = require('zod');
const colectivoService = require('../services/colectivoService.js');
const { BadRequestError } = require('../errors/AppError.js');

const colectivoSchema = z.object({
    id: z.number().int().positive(),
    nombre: z.string().min(1),
    descripcion: z.string().optional(),
    ubicacion: z.string().optional(),
    tipo: z.string().optional(),
    proyectos: z.array(z.string()).default([]),
}).strict()

class ColectivoController {
    constructor() {
        this.colectivoService = colectivoService;
    }

    obtenerColectivos = (req, res) => {
        const colectivos = this.colectivoService.obtenerTodos();
        res.status(200).json(colectivos)
    }

    crearColectivo = (req, res) => {
        const resultado = colectivoSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }

        const colectivoNuevo = this.colectivoService.crear(resultado.data)
        res.status(201).json({ message: 'Colectivo creado exitosamente', data: colectivoNuevo })
    }

    obtenerColectivoPorId = (req, res) => {
        const { id } = req.params
        const colectivo = this.colectivoService.obtenerPorId(parseInt(id))

        if (!colectivo) {
            return res.status(404).json({ message: 'Colectivo no encontrado' })
        }
        res.status(200).json(colectivo)
    }

    seed = (req, res) => {
        const COLECTIVOS_INICIALES = [
            {
                id: 1,
                nombre: "Colectivo Software Libre",
                descripcion: "Comunidad enfocada en desarrollo de software abierto",
                ubicacion: "Buenos Aires",
                tipo: "ONG",
                proyectos: []
            },
            {
                id: 2,
                nombre: "Tech For Good",
                descripcion: "Proyectos tecnológicos con impacto social",
                ubicacion: "Córdoba",
                tipo: "Fundación",
                proyectos: []
            }
        ];

        const lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : COLECTIVOS_INICIALES;
        const creados = lista.map(datos => this.colectivoService.crear(datos));

        return res.status(201).json({ status: "success", data: creados });
    }
}

module.exports = { ColectivoController };
