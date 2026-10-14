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
}

module.exports = new ProyectoRepository();
