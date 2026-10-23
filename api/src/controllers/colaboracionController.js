const colaboracionService = require('../services/colaboracionService.js');
const { toColaboracionPublic } = require('../dtos/mappers.js');

class ColaboracionController {
    constructor() {
        this.colaboracionService = colaboracionService;
    }

    obtenerColaboraciones = async (req, res) => {
        const colaboraciones = await this.colaboracionService.obtenerTodas()
        res.status(200).json(colaboraciones.map(toColaboracionPublic))
    }

    crearColaboracion = async (req, res) => {
        const colaboracionNueva = await this.colaboracionService.crear(req.body)
        res.status(201).json({ message: 'Colaboracion creada exitosamente', data: toColaboracionPublic(colaboracionNueva) })
    }
}

module.exports = { ColaboracionController };
