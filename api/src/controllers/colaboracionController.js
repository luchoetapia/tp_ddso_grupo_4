const colaboracionService = require('../services/colaboracionService.js');
const { ColaboracionPublic } = require('../dtos/colaboracionPublic.js');

class ColaboracionController {
    constructor() {
        this.colaboracionService = colaboracionService;
    }

    obtenerColaboraciones = async (req, res) => {
        const colaboraciones = await this.colaboracionService.obtenerTodas()
        res.status(200).json(colaboraciones.map(ColaboracionPublic.desde))
    }

    crearColaboracion = async (req, res) => {
        const colaboracionNueva = await this.colaboracionService.crear(req.body)
        res.status(201).json({ message: 'Colaboracion creada exitosamente', data: ColaboracionPublic.desde(colaboracionNueva) })
    }

    desanotarColaboracion = async (req, res) => {
    const colaboracion = await this.colaboracionService.desanotar(req.params.id, req.usuario)
    res.status(200).json({ message: 'Colaboración dada de baja exitosamente', data: ColaboracionPublic.desde(colaboracion) })
    }
}

module.exports = { ColaboracionController };
