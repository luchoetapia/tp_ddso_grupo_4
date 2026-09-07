import { ColaboradorService } from "../services/colaboradorService.js"

const colaboradorSchema = z.object({
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    nombreFantasia: z.string().optional(),
    cuentaGit: z.string().min(1),
    habilidades: z.array(z.string()).default([]),
    pronombres: z.string().optional(),
    presentacion: z.string().max(300).optional(),
}).strict()

export class ColaboradorController {
    constructor(colaboradorService = new ColaboradorService()) {
        this.colaboradorService = colaboradorService;
    }

    obtenerColaboradoras = (req, res) => {
    const colaboradores = this.colaboradorService.obtenerTodos()
    res.status(200).json(colaboradores)
}

    crearColaboradora = (req, res) => {
    const resultado = colaboradorSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }

    const colaboradoraNueva = this.colaboradorService.crear(resultado.data)
    res.status(201).json({ message: 'Colaboradora creada exitosamente', data: colaboradoraNueva })
}

    obtenerColaboradoraPorCuentaGit = (req, res) => {
    const { cuentaGit } = req.params
    const colaboradora = this.colaboradorService.obtenerPorCuentaGit(cuentaGit)
    if (!colaboradora) {
        return res.status(404).json({ message: 'Colaboradora no encontrada' })
    }
    res.status(200).json(colaboradora)
}

}