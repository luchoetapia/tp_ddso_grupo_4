const postulacionService = require('../services/postulacionService.js');

class PostulacionController {
    constructor() {
        this.postulacionService = postulacionService;
    }

    obtenerTodas = async (req, res) => {
        const postulaciones = await this.postulacionService.obtenerTodas(req.query);
        res.status(200).json(postulaciones);
    }

    obtenerPorId = async (req, res) => {
        const { id } = req.params;
        const postulacion = await this.postulacionService.obtenerPorId(id);
        res.status(200).json(postulacion);
    }

    crear = async (req, res) => {
        const nueva = await this.postulacionService.crear(req.body);
        res.status(201).json({
            message: 'Postulación creada exitosamente',
            data: nueva
        });
    }

    actualizarEstado = async (req, res) => {
        const { id } = req.params;
        const { estado } = req.body;
        const actualizada = await this.postulacionService.actualizarEstado(id, estado);
        res.status(200).json({
            message: `Postulación actualizada a '${estado}' exitosamente`,
            data: actualizada
        });
    }
}

module.exports = { PostulacionController };
