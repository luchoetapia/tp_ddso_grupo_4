import { HabilidadService } from "../services/habilidadService.js"

const habilidadSchema = z.object({
    id: z.number().int().positive(),
    titulo: z.string().min(1),
    tipoHabilidad: z.string().min(1),
    descripcion: z.string().optional(),
}).strict()

export class HabilidadController {
    constructor(habilidadService = new HabilidadService()) {
        this.habilidadService = habilidadService;
    }

    obtenerHabilidades = (req, res) => {
    const habilidades = this.habilidadService.obtenerTodos()
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

}