const ProyectoModel = require('../database/schemas/proyectoSchema.js');

class ProyectoRepository {
    async findAll() {
        return await ProyectoModel.find().populate('perfiles');
    }

    async findByTitulo(titulo) {
        return await ProyectoModel.findOne({ titulo });
    }

    async findById(id) {
        return await ProyectoModel.findById(id).populate('perfiles');
    }

    async findByIds(ids) {
        return await ProyectoModel.find({ _id: { $in: ids } });
    }

    async save(datos) {
        const proyecto = new ProyectoModel(datos);
        await proyecto.save();
        return await proyecto.populate('perfiles');
    }

    async update(id, cambios) {
        return await ProyectoModel.findByIdAndUpdate(id, cambios, { new: true }).populate('perfiles');
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

}

module.exports = new ProyectoRepository();
