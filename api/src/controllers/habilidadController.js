const { z } = require('zod');
const habilidadService = require('../services/habilidadService.js');
const { TipoHabilidad } = require('../models/dominio.js');
const { BadRequestError } = require('../errors/AppError.js');

const habilidadSchema = z.object({
    titulo: z.string().min(1),
    tipoHabilidad: z.enum(Object.values(TipoHabilidad)),
    descripcion: z.string().min(1),
}).strict()

class HabilidadController {
    constructor() {
        this.habilidadService = habilidadService;
    }

    obtenerHabilidades = async (req, res) => {
        const habilidades = await this.habilidadService.obtenerTodas();
        res.status(200).json(habilidades)
    }

    crearHabilidad = async (req, res) => {
        const resultado = habilidadSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }

        const habilidadNueva = await this.habilidadService.crear(resultado.data)
        res.status(201).json({ message: 'Habilidad creada exitosamente', data: habilidadNueva })
    }

    obtenerHabilidadPorId = async (req, res) => {
        const habilidad = await this.habilidadService.obtenerPorId(req.params.id)
        res.status(200).json(habilidad)
    }

    seed = async (req, res) => {
        const HABILIDADES_INICIALES = [
            {
                titulo: "JavaScript",
                tipoHabilidad: TipoHabilidad.PROGRAMACION,
                descripcion: "Lenguaje de programación de desarrollo web"
            },
            {
                titulo: "Node.js",
                tipoHabilidad: TipoHabilidad.PROGRAMACION,
                descripcion: "Entorno de ejecución para JavaScript"
            }
        ];

        const lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : HABILIDADES_INICIALES;

        const creadas = [];
        for (const datos of lista) {
            const resultado = habilidadSchema.safeParse(datos)
            if (resultado.error) {
                throw new BadRequestError("Datos inválidos", resultado.error.issues)
            }
            creadas.push(await this.habilidadService.crear(resultado.data));
        }

        return res.status(201).json({ status: "success", data: creadas });
    }
}

module.exports = { HabilidadController };
