const { z } = require('zod');
const colaboracionService = require('../services/colaboracionService.js');
const { BadRequestError } = require('../errors/AppError.js');

const colaboracionSchema = z.object({
    idProyecto: z.int().positive(),
    idColaborador: z.int().positive()
}).strict()

class ColaboracionController {
    constructor() {
        this.colaboracionService = colaboracionService;
    }

    obtenerColaboraciones = (req, res) => {
        const colaboraciones = this.colaboracionService.obtenerTodas()
        res.status(200).json(colaboraciones)
    }

    crearColaboracion = (req, res) => {
        const resultado = colaboracionSchema.safeParse(req.body)
        if (resultado.error) {
            throw new BadRequestError("Datos inválidos", resultado.error.issues)
        }

        const colaboracionNueva = this.colaboracionService.crear(resultado.data)
        res.status(201).json({ message: 'Colaboracion creada exitosamente', data: colaboracionNueva })
    }
}

module.exports = { ColaboracionController };
