const { z } = require('zod');
const { ProyectoService } = require('../services/proyectoService.js');
const { BadRequestError } = require('../errors/AppError.js');

const proyectoSchema = z.object({
    id: z.number().int().positive(),
    titulo: z.string().min(1),
    descripcion: z.string().optional(),
    habilidades: z.array(z.string()).optional(),
    tipoCompromiso: z.string().min(1),
    modalidadColaboracion: z.string().min(1)
}).strict()

class ProyectoController {
    constructor(proyectoService = new ProyectoService()) {
        this.proyectoService = proyectoService;
    }

    obtenerProyectos = (req, res) => {
        const proyectos = this.proyectoService.obtenerTodos()
        res.status(200).json(proyectos)
    }

    crearProyecto = (req, res) => {
        const resultado = proyectoSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }
        const proyectoNuevo = this.proyectoService.crear(resultado.data)
        res.status(201).json({ message: 'Proyecto creado exitosamente', data: proyectoNuevo })
    }

    obtenerProyectoPorId = (req, res) => {
        const { id } = req.params
        const proyecto = this.proyectoService.obtenerPorId(parseInt(id))

        if (!proyecto) {
            return res.status(404).json({ message: 'Proyecto no encontrado' })
        }
        res.status(200).json(proyecto)
    }
}

module.exports = { ProyectoController };
