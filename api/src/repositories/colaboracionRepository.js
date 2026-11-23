const ColaboracionModel = require('../database/schemas/colaboracionSchema');


class ColaboracionRepository {
    constructor() {
        this.model = ColaboracionModel;
    }

    async buscarConPaginacion(pagina = 1, limite = 10, filtros = {}, orden = {}, datosNecesarios = null) {
        limite = Math.min(limite, 100); // Tope de documentos por página

        const [colaboraciones, total] = await Promise.all([
            this.model.find(filtros, datosNecesarios)
                .paginar({ pagina, limite, orden }),
            this.model.countDocuments(filtros)
        ]);

        return { colaboraciones, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
    }

    async findAll() {
        return await ColaboracionModel.find();
    }

    async findActiva(idColaborador, idProyecto) {
        return await ColaboracionModel.findOne({
            'colaborador.id': idColaborador,
            'proyecto.id': idProyecto,
            fin: null
        });
    }

    async contarActivasPorPerfil(idProyecto, idPerfil) {
        return await ColaboracionModel.countDocuments({
            'proyecto.id': idProyecto,
            perfil: idPerfil,
            fin: null
        });
    }

    async findByProyectoID(idProyecto) {
        return await ColaboracionModel.find({ 'proyecto.id': idProyecto });
    }

    async existenDelProyecto(idProyecto) {
        return Boolean(await ColaboracionModel.exists({ 'proyecto.id': idProyecto }));
    }

    async findByColaboradorID(idColaborador) {
        return await ColaboracionModel.find({ 'colaborador.id': idColaborador });
    }

    async buscarPorVariosProyectos(proyectos) {
        return await ColaboracionModel.find({ 'proyecto.id': { $in: proyectos } });
    }

    async save(colaboracion) {
        return await ColaboracionModel.create(colaboracion);
    }

    async findById(id) {
        return await ColaboracionModel.findById(id);
    }

    async cerrar(id, fin) {
        return await ColaboracionModel.findOneAndUpdate(
            { _id: id, fin: null },
            { fin },
            { new: true }
        );
    }

    async totalColaboradoresDistintos() {
        const estadisticas = await this.estadisticasGlobales();
        return estadisticas.colaboradores;
    }

    async estadisticasGlobales() {
        const [resultado] = await ColaboracionModel.aggregate([
            {
                $group: {
                    _id: null,
                    colaboracionesTotales: { $sum: 1 },
                    colaboracionesActivas: {
                        $sum: {
                            $cond: [{ $eq: ['$fin', null] }, 1, 0]
                        }
                    },
                    colaboracionesFinalizadas: {
                        $sum: {
                            $cond: [{ $ne: ['$fin', null] }, 1, 0]
                        }
                    },
                    colaboradores: { $addToSet: '$colaborador.id' }
                }
            },
            {
                $project: {
                    _id: 0,
                    colaboracionesTotales: 1,
                    colaboracionesActivas: 1,
                    colaboracionesFinalizadas: 1,
                    colaboradores: { $size: '$colaboradores' }
                }
            }
        ]);

        return resultado ?? {
            colaboracionesTotales: 0,
            colaboracionesActivas: 0,
            colaboracionesFinalizadas: 0,
            colaboradores: 0
        };
    }

    async cerrarYAnonimizarPorColaborador(idColaborador, fin) {
        await ColaboracionModel.updateMany(
            { 'colaborador.id': idColaborador, fin: null },
            { $set: { fin } }
        );

        // Anonimiza también las colaboraciones ya finalizadas, sin borrarlas
        return ColaboracionModel.updateMany(
            { 'colaborador.id': idColaborador },
            {
                $set: {
                    'colaborador.nombre': 'UsuarioEliminado',
                    'colaborador.apellido': null,
                },
                $unset: { 'colaborador.usuario': 1 },
            }
        );
    }
}

module.exports = new ColaboracionRepository();