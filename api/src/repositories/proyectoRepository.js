const ProyectoModel = require('../database/schemas/proyectoSchema');

class ProyectoRepository {
    constructor() {
        this.model = ProyectoModel;
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

    save(proyecto) {
        return this.model.create(proyecto);
    }
}

module.exports = new ProyectoRepository();
