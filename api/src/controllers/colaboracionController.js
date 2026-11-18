const colaboracionService = require('../services/colaboracionService.js');
const { ColaboracionPublic } = require('../dtos/colaboracionPublic.js');
const { Paginado } = require('../dtos/paginado.js');

class ColaboracionController {
    constructor() {
        this.colaboracionService = colaboracionService;
    }

    obtenerColaboraciones = async (req, res) => {
        const { pagina, limite, orden, direccion } = req.query;

        const resultado = await this.colaboracionService.obtenerTodas({ pagina, limite, orden, direccion })
        res.status(200).json(Paginado.desde(resultado.colaboraciones, resultado, ColaboracionPublic))
    }

    crearColaboracion = async (req, res) => {
        const colaboracionNueva = await this.colaboracionService.crear(req.body)
        res.status(201).json({ message: 'Colaboracion creada exitosamente', data: ColaboracionPublic.desde(colaboracionNueva) })
    }

    obtenerColaboracionPorProyecto = async (req, res) => {
        const colaboraciones = await this.colaboracionService.obtenerPorProyectoId(req.params.id);
        const response = colaboraciones.map(c => ColaboracionPublic.desde(c));
        res.status(200).json(response);
    }

    obtenerColaboracionPorColaborador = async (req, res) => {
        const colaboraciones = await this.colaboracionService.obtenerPorColaboradorId(req.params.id);
        const response = colaboraciones.map(c => ColaboracionPublic.desde(c));
        res.status(200).json(response);
    }

    desanotarColaboracion = async (req, res) => {
        const colaboracion = await this.colaboracionService.desanotar(req.params.id, req.usuario)
        res.status(200).json({ message: 'Colaboración dada de baja exitosamente', data: ColaboracionPublic.desde(colaboracion) })
    }
}

module.exports = { ColaboracionController };
