const HabilidadModel = require('../database/schemas/habilidadSchema.js');

class HabilidadRepository {
    async findAll() {
        return await HabilidadModel.find();
    }

    async findByTitulo(titulo) {
        return await HabilidadModel.findOne({ titulo });
    }

    async findById(id) {
        return await HabilidadModel.findById(id);
    }

    async findByIds(ids) {
        return await HabilidadModel.find({ _id: { $in: ids } });
    }

    async save(datos) {
        const habilidad = new HabilidadModel(datos);
        return await habilidad.save();
    }
}

module.exports = new HabilidadRepository();
