const ProyectoModel = require('../database/schemas/proyectoSchema');

class ProyectoRepository {
    constructor() {
        this.model = ProyectoModel;
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

    async save(proyecto) {
        return await this.model.create(proyecto);
    }
}

module.exports = new ProyectoRepository();
