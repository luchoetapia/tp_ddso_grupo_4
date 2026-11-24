const ProyectoModel = require('../database/schemas/proyectoSchema.js');
const HabilidadModel = require('../database/schemas/habilidadSchema.js');
const ColaboracionModel = require('../database/schemas/colaboracionSchema.js');

// Habilidades de los perfiles embebidos, necesarias para armar la vista pública del proyecto y sus perfiles
const HABILIDADES_PERFILES = ['perfiles.habilidadesRequeridas', 'perfiles.habilidadesOpcionales'];

class ProyectoRepository {
    async buscarConPaginacion(pagina = 1, limite = 10, filtros = {}, orden = {}, datosNecesarios = null) {
        limite = Math.min(limite, 100); // Tope de documentos por página

        const [proyectos, total] = await Promise.all([
            ProyectoModel.find(filtros, datosNecesarios)
                .paginar({ pagina, limite, orden })
                .populate(HABILIDADES_PERFILES),
            ProyectoModel.countDocuments(filtros)
        ]);

        return { proyectos, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
    }

    async findAll() {
        return await ProyectoModel.find().populate(HABILIDADES_PERFILES);
    }

    async findByTitulo(titulo) {
        return await ProyectoModel.findOne({ titulo });
    }

    async findById(id, proyeccion) {
        return await ProyectoModel.findById(id, proyeccion).populate(HABILIDADES_PERFILES);
    }

    async findByIds(ids) {
        return await ProyectoModel.find({ _id: { $in: ids } }).lean();
    }

    async findByCondition(condition) {
        return await ProyectoModel.find(condition).populate(HABILIDADES_PERFILES);
    }

    async findAbiertosCumplibles(idsHabilidades, ahora = new Date()) {
        return await ProyectoModel.find({
            finalizado: false,
            perfiles: {
                $elemMatch: {
                    busquedaAbierta: true,
                    $or: [{ fechaFinBusqueda: null }, { fechaFinBusqueda: { $gt: ahora } }],
                    habilidadesRequeridas: { $not: { $elemMatch: { $nin: idsHabilidades } } }
                }
            }
        }).populate(HABILIDADES_PERFILES);
    }

    async obtenerActivos() {
        return await ProyectoModel.find({ finalizado: false }).lean();
    }

    async save(datos) {
        const proyecto = new ProyectoModel(datos);
        await proyecto.save();
        return await proyecto.populate(HABILIDADES_PERFILES);
    }

    async update(id, cambios) {
        return await ProyectoModel.findByIdAndUpdate(id, cambios, { new: true }).populate(HABILIDADES_PERFILES);
    }

    async updateMultiple(ids, cambios) {
        return await ProyectoModel.updateMany({ _id: { $in: ids } }, cambios);
    }

    async delete(id) {
        return await ProyectoModel.findByIdAndDelete(id);
    }

    async logrosDelProyecto(idProyecto) {
        const proyecto = await ProyectoModel.findById(idProyecto);
        return proyecto ? proyecto.logros : null;
    }

    async agregarLogro(idProyecto, datosLogro) {
        return await ProyectoModel.findByIdAndUpdate(
            idProyecto,
            {
                $push: { logros: datosLogro },
                $set: { requiereRevisionManual: false, revisionManualMotivo: null, revisionManualFecha: null }
            },
            { new: true }
        );
    }

    async modificarLogro(idProyecto, idLogro, cambios) {
        const set = {};
        for (const [campo, valor] of Object.entries(cambios)) {
            set[`logros.$.${campo}`] = valor;
        }

        return await ProyectoModel.findOneAndUpdate(
            { _id: idProyecto, 'logros._id': idLogro },
            { $set: set },
            { new: true }
        );
    }

    async eliminarLogro(idProyecto, idLogro) {
        return await ProyectoModel.findOneAndUpdate(
            { _id: idProyecto, 'logros._id': idLogro },
            { $pull: { logros: { _id: idLogro } } },
            { new: true }
        );
    }

    async totalActivos() {
        return await ProyectoModel.countDocuments({ finalizado: false })
    }

    async estadisticasGlobales() {
        const [resultado] = await ProyectoModel.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    activos: {
                        $sum: { $cond: [{ $eq: ['$finalizado', false] }, 1, 0] }
                    },
                    finalizados: {
                        $sum: { $cond: [{ $eq: ['$finalizado', true] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    activos: 1,
                    finalizados: 1
                }
            }
        ]);

        return resultado ?? { total: 0, activos: 0, finalizados: 0 };
    }

    async masReciente(fechaLimite) {
        return await ProyectoModel.findOne({ finalizado: false, createdAt: { $gte: fechaLimite } })
            .sort({ createdAt: -1 })
            .populate(HABILIDADES_PERFILES);
    }

    async mayorProgreso(fechaLimite) {
        return await ProyectoModel.findOne({ finalizado: false, createdAt: { $gte: fechaLimite } })
            .sort({ porcentajeFinalizado: -1, updatedAt: -1 })
            .populate(HABILIDADES_PERFILES);
    }

    async masPerfiles(fechaLimite) {
        const [mayor] = await ProyectoModel.aggregate([
            { $match: { finalizado: false, createdAt: { $gte: fechaLimite } } },
            { $project: { cantidadPerfiles: { $size: '$perfiles' }, createdAt: 1 } },
            { $sort: { cantidadPerfiles: -1, createdAt: -1 } },
            { $limit: 1 }
        ]);
        return mayor ? await this.findById(mayor._id) : null;
    }


    // Perfiles

    async agregarPerfil(idProyecto, perfil) {
        return await ProyectoModel.findByIdAndUpdate(
            idProyecto,
            { $push: { perfiles: perfil } },
            { new: true }
        ).populate(HABILIDADES_PERFILES);
    }

    async agregarMultiplesPerfiles(idProyecto, perfiles) {
        return await ProyectoModel.findByIdAndUpdate(
            idProyecto,
            { $push: { perfiles: { $each: perfiles } } },
            { new: true }
        );
    }

    async obtenerPerfiles(idProyecto) {
        const proyecto = await ProyectoModel.findById(idProyecto, { perfiles: 1, _id: 0 }).populate(HABILIDADES_PERFILES);
        return proyecto ? proyecto.perfiles : null;
    }

    async obtenerPerfil(idProyecto, idPerfil) {
        const proyecto = await ProyectoModel.findOne(
            { _id: idProyecto, 'perfiles._id': idPerfil },
            { 'perfiles.$': 1 }
        ).populate(HABILIDADES_PERFILES);
        return proyecto ? proyecto.perfiles[0] : null;
    }

    async modificarPerfil(idProyecto, idPerfil, cambios) {
        const set = {};
        for (const [campo, valor] of Object.entries(cambios)) {
            set[`perfiles.$.${campo}`] = valor;
        }

        return await ProyectoModel.findOneAndUpdate(
            { _id: idProyecto, 'perfiles._id': idPerfil },
            { $set: set },
            { new: true }
        ).populate(HABILIDADES_PERFILES);
    }

    async eliminarPerfil(idProyecto, idPerfil) {
        return await ProyectoModel.findOneAndUpdate(
            { _id: idProyecto, 'perfiles._id': idPerfil },
            { $pull: { perfiles: { _id: idPerfil } } },
            { new: true }
        );
    }

    async eliminarMultiplesPerfiles(idProyecto, idsPerfiles) {
        return await ProyectoModel.findByIdAndUpdate(
            idProyecto,
            { $pull: { perfiles: { _id: { $in: idsPerfiles } } } },
            { new: true }
        );
    }

    // Cantidad de habilidades distintas (requeridas u opcionales) pedidas en los perfiles de proyectos activos
    async totalHabilidadesBuscadas() {
        const [resultado] = await ProyectoModel.aggregate([
            { $match: { finalizado: false } },
            { $unwind: '$perfiles' },
            { $project: { habilidades: { $setUnion: ['$perfiles.habilidadesRequeridas', '$perfiles.habilidadesOpcionales'] } } },
            { $unwind: '$habilidades' },
            { $group: { _id: '$habilidades' } },
            { $count: 'total' }
        ]);
        return resultado?.total ?? 0;
    }

    async rankingHabilidades(limite) {
        return await ProyectoModel.aggregate([
            { $match: { finalizado: false } },
            {
                $project: {
                    habilidades: {
                        $reduce: {
                            input: '$perfiles',
                            initialValue: [],
                            in: {
                                $setUnion: [
                                    '$$value',
                                    { $ifNull: ['$$this.habilidadesRequeridas', []] },
                                    { $ifNull: ['$$this.habilidadesOpcionales', []] }
                                ]
                            }
                        }
                    }
                }
            },
            { $unwind: '$habilidades' },
            { $group: { _id: '$habilidades', proyectos: { $sum: 1 } } },
            { $lookup: { from: HabilidadModel.collection.name, localField: '_id', foreignField: '_id', as: 'habilidad' } },
            { $unwind: '$habilidad' }, // descarta referencias a habilidades que ya no existen
            { $sort: { proyectos: -1, 'habilidad.titulo': 1 } },
            { $limit: limite },
            { $project: { _id: 0, id: { $toString: '$_id' }, titulo: '$habilidad.titulo', proyectos: 1 } }
        ]);
    }

    async marcarParaRevisionPorFaltaDeActualizaciones(fechaLimite) {
        // Proyectos con al menos una colaboración activa
        const proyectosIniciados = await ColaboracionModel.distinct('proyecto.id', {
            fin: null
        });

        if (proyectosIniciados.length === 0) {
            return { modifiedCount: 0 };
        }

        return ProyectoModel.updateMany(
            {
                _id: { $in: proyectosIniciados },
                finalizado: false,
                createdAt: { $lte: fechaLimite },
                logros: {
                    $not: {
                        $elemMatch: { createdAt: { $gte: fechaLimite } }
                    }
                },
                requiereRevisionManual: { $ne: true }
            },
            {
                $set: {
                    requiereRevisionManual: true,
                    revisionManualMotivo: 'Sin actualizaciones recientes',
                    revisionManualFecha: new Date()
                }
            }
        );
    }
}

module.exports = new ProyectoRepository();
