const publicacionLinkedinService = require('../services/publicacionLinkedinService.js');
const { urlDelPost } = require('../linkedin/linkedinService.js');

class LinkedinController {
    constructor() {
        this.publicacionService = publicacionLinkedinService;
    }

    publicar = async (req, res) => {
        const { idPublicacion, colaboracion } = await this.publicacionService.publicar(req.usuario.id, req.body);

        res.status(201).json({
            message: 'Publicación creada en LinkedIn',
            data: {
                idPublicacion,
                // Link al post (si LinkedIn devolvió el id)
                url: urlDelPost(idPublicacion),
                proyectoId: String(colaboracion.proyecto.id),
                colaboracionId: String(colaboracion._id ?? colaboracion.id),
            },
        });
    }
}

module.exports = { LinkedinController };
