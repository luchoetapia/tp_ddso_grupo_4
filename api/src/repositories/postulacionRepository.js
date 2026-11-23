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

    async existeAceptadaEnProyectos(idColaborador, idsProyectos) {
        const encontrada = await PostulacionModel.exists({
            colaborador: idColaborador,
            proyecto: { $in: idsProyectos },
            estado: EstadoPostulacion.ACEPTADA
        });
        return Boolean(encontrada);
    }

    async updateEstado(id, nuevoEstado) {
        return await PostulacionModel.findByIdAndUpdate(
            id,
            { estado: nuevoEstado },
            { new: true }
        ).populate(REFERENCIAS);
    }

    async eliminarPorProyecto(idProyecto) {
        const { deletedCount } = await PostulacionModel.deleteMany({ proyecto: idProyecto });
        return deletedCount;
    }

    async cantidadPendientesDeVariosProyectos(proyectos) {
        return await PostulacionModel.countDocuments({
            proyecto: { $in: proyectos },
            estado: EstadoPostulacion.PENDIENTE
        });
    }

    async rechazarPendientesDeColaborador(idColaborador) {
        return PostulacionModel.updateMany(
            { colaborador: idColaborador, estado: EstadoPostulacion.PENDIENTE },
            { $set: { estado: EstadoPostulacion.RECHAZADA } }
        );
    }
}

module.exports = new PostulacionRepository();
