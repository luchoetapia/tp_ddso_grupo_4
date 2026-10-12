const ProyectoModel = require('../database/schemas/proyectoSchema.js');

class ProyectoRepository {
    async findAll() {
        return await ProyectoModel.find().populate('habilidades');
    }

    async findByTitulo(titulo) {
        return await ProyectoModel.findOne({ titulo });
    }

    async findById(id) {
        return await ProyectoModel.findById(id).populate('habilidades');
    }

    async save(datos) {
        const proyecto = new ProyectoModel(datos);
        await proyecto.save();
        return await proyecto.populate('habilidades');
    }

    async update(id, cambios) {
        return await ProyectoModel.findByIdAndUpdate(id, cambios, { new: true }).populate('habilidades');
    }
}

module.exports = new ProyectoRepository();
