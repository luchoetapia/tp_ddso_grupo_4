import { ProyectoService } from "../services/proyectoService.js"

const proyectoSchema = z.object({
    id: z.number().int().positive(),
    titulo: z.string().min(1),
    descripcion: z.string().optional(),
    habilidades: z.array(z.string()).optional(),
    tipoCompromiso: z.string().min(1),
    modalidadColaboracion: z.string().min(1)
}).strict()

export class ProyectoController {
    constructor(proyectoService = new ProyectoService()) {
        this.proyectoService = proyectoService;
    }

    obtenerProyectos = (req, res) => {
    const proyectos = this.proyectoService.obtenerTodos()
    res.status(200).json(proyectos)
}

    crearProyecto = (req, res) => {
    const resultuado = proyectoSchema.safeParse(req.body)
        if (resultuado.error) {
            throw new BadRequestError("Datos inválidos", resultuado.error.issues)
        }
    const proyectoNuevo = this.proyectoService.crear(resultuado.data)
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