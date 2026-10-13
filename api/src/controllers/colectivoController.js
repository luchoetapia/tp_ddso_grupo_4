const { z } = require('zod');
const colectivoService = require('../services/colectivoService.js');
const { TipoColectivo } = require('../models/dominio.js');
const { BadRequestError } = require('../errors/AppError.js');

const colectivoSchema = z.object({
    nombre: z.string().min(1),
    descripcion: z.string().optional(),
    ubicacion: z.string().optional(),
    tipo: z.enum(Object.values(TipoColectivo)),
    proyectos: z.array(z.string()).default([]),
}).strict()

class ColectivoController {
    constructor() {
        this.colectivoService = colectivoService;
    }

    obtenerColectivos = async (req, res) => {
        const colectivos = await this.colectivoService.obtenerTodos();
        res.status(200).json(colectivos)
    }

    crearColectivo = async (req, res) => {
        const resultado = colectivoSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }

        const colectivoNuevo = await this.colectivoService.crear(resultado.data)
        res.status(201).json({ message: 'Colectivo creado exitosamente', data: colectivoNuevo })
    }

    obtenerColectivoPorId = async (req, res) => {
        const colectivo = await this.colectivoService.obtenerPorId(req.params.id)
        res.status(200).json(colectivo)
    }

    llenarDatosPrueba = async (req, res) => {
        const COLECTIVOS_INICIALES = [
            {
                nombre: "Colectivo Software Libre",
                descripcion: "Comunidad enfocada en desarrollo de software abierto",
                ubicacion: "Buenos Aires",
                tipo: TipoColectivo.ONG,
                proyectos: []
            },
            {
                nombre: "Tech For Good",
                descripcion: "Proyectos tecnológicos con impacto social",
                ubicacion: "Córdoba",
                tipo: TipoColectivo.FUNDACION,
                proyectos: []
            }
        ];

        const lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : COLECTIVOS_INICIALES;

        const creados = [];
        for (const datos of lista) {
            const resultado = colectivoSchema.safeParse(datos)
            if (resultado.error) {
                throw new BadRequestError("Datos inválidos", resultado.error.issues)
            }
            creados.push(await this.colectivoService.crear(resultado.data));
        }

        return res.status(201).json({ status: "success", data: creados });
    }
}

module.exports = { ColectivoController };
