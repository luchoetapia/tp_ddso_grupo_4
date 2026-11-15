const PostulacionModel = require('../database/schemas/postulacionSchema.js');
const EstadoPostulacion = require('../models/Proyecto/Postulaciones/EstadoPostulacion.js');

const REFERENCIAS = [
    { path: 'colaborador' },
    { path: 'proyecto' }
];

class PostulacionRepository {
    async save(datos) {
        const postulacion = await PostulacionModel.create(datos);
        return await postulacion.populate(REFERENCIAS);
    }

    async findById(id) {
        return await PostulacionModel.findById(id).populate(REFERENCIAS);
    }

    async findAll(filtros = {}) {
        return await PostulacionModel.find(filtros).populate(REFERENCIAS);
    }

    async findActiva(idColaborador, idProyecto, idPerfil) {
        return await PostulacionModel.findOne({
            colaborador: idColaborador,
            proyecto: idProyecto,
            perfil: idPerfil,
            estado: { $in: [EstadoPostulacion.PENDIENTE, EstadoPostulacion.ACEPTADA] }
        });
    }

    async updateEstado(id, nuevoEstado) {
        return await PostulacionModel.findByIdAndUpdate(
            id,
            { estado: nuevoEstado },
            { new: true }
        ).populate(REFERENCIAS);
    }
}

module.exports = new PostulacionRepository();
