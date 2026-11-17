const postulacionService = require('../services/postulacionService.js');
const { PostulacionPublic } = require('../dtos/postulacionPublic.js');

class PostulacionController {
    constructor() {
        this.postulacionService = postulacionService;
    }

    obtenerTodas = async (req, res) => {
        const postulaciones = await this.postulacionService.obtenerTodas(req.query);
        res.status(200).json(postulaciones.map(PostulacionPublic.desde));
    }

    obtenerPorId = async (req, res) => {
        const { id } = req.params;
        const postulacion = await this.postulacionService.obtenerPorId(id);
        res.status(200).json(PostulacionPublic.desde(postulacion));
    }

    crear = async (req, res) => {
        const nueva = await this.postulacionService.crear(req.body);
        res.status(201).json({
            message: 'Postulación creada exitosamente',
            data: PostulacionPublic.desde(nueva)
        });
    }

    actualizarEstado = async (req, res) => {
        const { id } = req.params;
        const { estado } = req.body;
        const actualizada = await this.postulacionService.actualizarEstado(id, estado);
        res.status(200).json({
            message: `Postulación actualizada a '${estado}' exitosamente`,
            data: PostulacionPublic.desde(actualizada)
        });
    }
}

module.exports = { PostulacionController };
