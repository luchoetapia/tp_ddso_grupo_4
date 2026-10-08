const { z } = require('zod');
const habilidadService = require('../services/habilidadService.js');
const { BadRequestError } = require('../errors/AppError.js');

const habilidadSchema = z.object({
    id: z.number().int().positive(),
    titulo: z.string().min(1),
    tipoHabilidad: z.string().min(1),
    descripcion: z.string().optional(),
}).strict()

class HabilidadController {
    constructor() {
        this.habilidadService = habilidadService;
    }

    obtenerHabilidades = (req, res) => {
        const habilidades = this.habilidadRepository.findAll();
        res.status(200).json(habilidades)
    }

    crearHabilidad = (req, res) => {
        const resultado = habilidadSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }

        const habilidadNueva = this.habilidadService.crear(resultado.data)
        res.status(201).json({ message: 'Habilidad creada exitosamente', data: habilidadNueva })
    }

    obtenerHabilidadPorId = (req, res) => {
        const { id } = req.params
        const habilidad = this.habilidadService.obtenerPorId(parseInt(id))

        if (!habilidad) {
            return res.status(404).json({ message: 'Habilidad no encontrada' })
        }
        res.status(200).json(habilidad)
    }

    seed = (req, res) => {
        const HABILIDADES_INICIALES = [
            {
                id: 1,
                titulo: "JavaScript",
                tipoHabilidad: "Programación",
                descripcion: "Lenguaje de programación de desarrollo web"
            },
            {
                id: 2,
                titulo: "Node.js",
                tipoHabilidad: "Backend",
                descripcion: "Entorno de ejecución para JavaScript"
            }
        ];

        const lista = Array.isArray(req.body) && req.body.length > 0 ? req.body : HABILIDADES_INICIALES;
        const creadas = lista.map(datos => this.habilidadService.crear(datos));

        return res.status(201).json({ status: "success", data: creadas });
    }
}

module.exports = { HabilidadController };
