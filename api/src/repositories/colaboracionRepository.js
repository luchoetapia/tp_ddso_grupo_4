const ColaboracionModel = require('../database/schemas/colaboracionSchema');

// Datos mínimos del colaborador y del proyecto para la vista pública de la colaboración
const REFERENCIAS = [
    { path: 'colaborador', select: 'cuentaGit' },
    { path: 'proyecto', select: 'titulo' }
];

class ColaboracionRepository {
    constructor() {
        this.model = ColaboracionModel;
    }

    async buscarConPaginacion(pagina = 1, limite = 10, filtros = {}, orden = {}, datosNecesarios = null) {
        limite = Math.min(limite, 100); // Tope de documentos por página

        const [colaboraciones, total] = await Promise.all([
            this.model.find(filtros, datosNecesarios)
                .paginar({ pagina, limite, orden })
                .populate(REFERENCIAS),
            this.model.countDocuments(filtros)
        ]);

        return { colaboraciones, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
    }

    async findAll() {
        return await ColaboracionModel.find().populate(REFERENCIAS);
    }

    async findActiva(idColaborador, idProyecto) {
        return await ColaboracionModel.findOne({ colaborador: idColaborador, proyecto: idProyecto, fin: null });
    }

    async contarActivasPorPerfil(idProyecto, idPerfil) {
        return await ColaboracionModel.countDocuments({ proyecto: idProyecto, perfil: idPerfil, fin: null });
    }

    async findByProyectoID(idProyecto) {
        return await ColaboracionModel.find({proyecto: idProyecto});
    }

    async buscarPorVariosProyectos(proyectos) {
        return await ColaboracionModel.find({ proyecto: { $in: proyectos } });
    }

    async save(colaboracion) {
        const creada = await ColaboracionModel.create(colaboracion);
        return await creada.populate(REFERENCIAS);
    }

    async findById(id) {
        return await ColaboracionModel.findById(id).populate(REFERENCIAS);
    }

    async cerrar(id, fin) {
        return await ColaboracionModel.findOneAndUpdate({ _id: id, fin: null }, { fin }, { new: true }).populate(REFERENCIAS);
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
                    colaboradores: { $addToSet: '$colaborador' }
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

}

module.exports = new ColaboracionRepository();
