const ColectivoModel = require('../database/schemas/colectivoSchema');

class ColectivoRepository {
    constructor() {
        this.model = ColectivoModel;
    }

    findAll() {
        return this.model.find();
    }

    findByNombre(nombre) {
        return this.model.findOne({ nombre: nombre });
    }

    findById(id) {
        return this.model.findById(id);
    }

    save(colectivo) {
        return this.model.create(colectivo);
    }
}

module.exports = new ColectivoRepository();
