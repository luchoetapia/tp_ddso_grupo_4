const HabilidadModel = require('../database/schemas/habilidadSchema');

class HabilidadRepository {
    constructor() {
        this.model = HabilidadModel;
    }

    findAll() {
        return this.model.find();
    }

    findByTitulo(titulo) {
        return this.model.findOne({ titulo: titulo });
    }

    findById(id) {
        return this.model.findById(id);
    }

    save(habilidad) {
        return this.model.create(habilidad);
    }
}

module.exports = new HabilidadRepository() ;
