const HabilidadModel = require('../database/schemas/habilidadSchema');

class HabilidadRepository {
    constructor() {
        this.model = HabilidadModel;
    }

    async findAll() {
        return await this.model.find();
    }

    async findByTitulo(titulo) {
        return await this.model.findOne({ titulo: titulo });
    }

    async findById(id) {
        return await this.model.findById(id);
    }

    async save(habilidad) {
        return await this.model.create(habilidad);
    }
}

module.exports = new HabilidadRepository() ;
