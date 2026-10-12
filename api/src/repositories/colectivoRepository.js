const ColectivoModel = require('../database/schemas/colectivoSchema');

class ColectivoRepository {
    constructor() {
        this.model = ColectivoModel;
    }

    async findAll() {
        return await this.model.find();
    }

    async findByNombre(nombre) {
        return await this.model.findOne({ nombre: nombre });
    }

    async findById(id) {
        return await this.model.findById(id);
    }

    async save(colectivo) {
        return await this.model.create(colectivo);
    }
}

module.exports = new ColectivoRepository();
