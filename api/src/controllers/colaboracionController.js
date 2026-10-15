const colaboracionService = require('../services/colaboracionService.js');

class ColaboracionController {
    constructor() {
        this.colaboracionService = colaboracionService;
    }

    obtenerColaboraciones = async (req, res) => {
        const colaboraciones = await this.colaboracionService.obtenerTodas()
        res.status(200).json(colaboraciones)
    }

    crearColaboracion = async (req, res) => {
        const colaboracionNueva = await this.colaboracionService.crear(req.body)
        res.status(201).json({ message: 'Colaboracion creada exitosamente', data: colaboracionNueva })
    }
}

module.exports = { ColaboracionController };
