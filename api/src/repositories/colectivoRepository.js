const ColectivoModel = require('../database/schemas/colectivoSchema.js');

class ColectivoRepository {
    async findAll() {
        return await ColectivoModel.find().populate('proyectos');
    }

    async findByNombre(nombre) {
        return await ColectivoModel.findOne({ nombre });
    }

    async findById(id) {
        return await ColectivoModel.findById(id).populate('proyectos');
    }

    async save(datos) {
        const colectivo = new ColectivoModel(datos);
        await colectivo.save();
        return await colectivo.populate('proyectos');
    }
}

module.exports = new ColectivoRepository();
