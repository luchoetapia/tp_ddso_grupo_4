const ProyectoModel = require('../database/schemas/proyectoSchema.js');

class ProyectoRepository {
    async findAll() {
        return await ProyectoModel.find().lean();
    }

    async findByTitulo(titulo) {
        return await ProyectoModel.findOne({ titulo });
    }

    async findById(id, proyeccion) {
        return await ProyectoModel.findById(id, proyeccion);
    }

    async findByIds(ids) {
        return await ProyectoModel.find({ _id: { $in: ids } }).lean();
    }

    async findByCondition(condition) {
        return await ProyectoModel.find(condition);
    }

    async obtenerActivos() {
        return await ProyectoModel.find({ finalizado: false }).lean();
    }

    async save(datos) {
        const proyecto = new ProyectoModel(datos);
        await proyecto.save();
        return await proyecto.populate('perfiles');
    }

    async update(id, cambios) {
        return await ProyectoModel.findByIdAndUpdate(id, cambios, { new: true });
    }

    async updateMultiple(ids, cambios) {
        return await ProyectoModel.updateMany({ _id: { $in: ids } }, cambios);
    }

    async logrosDelProyecto(idProyecto) {
        const proyecto = await ProyectoModel.findById(idProyecto);
        return proyecto ? proyecto.logros : null;
    }

    async agregarLogro(idProyecto, datosLogro) {
        return await ProyectoModel.findByIdAndUpdate(
            idProyecto,
            { $push: { logros: datosLogro } },
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

    async agregarPerfil(idProyecto, perfil) {
        return await ProyectoModel.findByIdAndUpdate(
            idProyecto,
            { $push: { perfiles: perfil } },
            { new: true }
        );
    }

    async agregarMultiplesPerfiles(idProyecto, perfiles) {
        return await ProyectoModel.findByIdAndUpdate(
            idProyecto,
            { $push: { perfiles: { $each: perfiles } } },
            { new: true }
        );
    }

    async obtenerPerfiles(idProyecto) {
        const proyecto = await ProyectoModel.findById(idProyecto, { perfiles: 1, _id: 0 });
        return proyecto ? proyecto.perfiles : null;
    }

    async obtenerPerfil(idProyecto, idPerfil) {
        const proyecto = await ProyectoModel.findOne(
            { _id: idProyecto, 'perfiles._id': idPerfil },
            { 'perfiles.$': 1 }
        );
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
        );
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
}

module.exports = new ProyectoRepository();
