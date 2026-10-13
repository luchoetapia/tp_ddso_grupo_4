const { z } = require('zod');
const colaboracionService = require('../services/colaboracionService.js');
const { BadRequestError } = require('../errors/AppError.js');

const colaboracionSchema = z.object({
    idProyecto: z.string().min(1),
    idColaborador: z.string().min(1)
}).strict()

class ColaboracionController {
    constructor() {
        this.colaboracionService = colaboracionService;
    }

    obtenerColaboraciones = async (req, res) => {
        const colaboraciones = await this.colaboracionService.obtenerTodas()
        res.status(200).json(colaboraciones)
    }

    crearColaboracion = async (req, res) => {
        const resultado = colaboracionSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }

        const colaboracionNueva = await this.colaboracionService.crear(resultado.data)
        res.status(201).json({ message: 'Colaboracion creada exitosamente', data: colaboracionNueva })
    }
}

module.exports = { ColaboracionController };
