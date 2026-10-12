const ColaboradorModel = require('../database/schemas/colaboradorSchema');

class ColaboradorRepository {

    constructor() {
        this.model = ColaboradorModel;
    }

    async findAll() {
        return await this.model.find();
    }

    async findByID(idBuscado) {
        return await this.model.findById(idBuscado);
    }

    async findByCuentaGit(cuentaGit) {
        return await this.model.findOne({ cuentaGit: cuentaGit });
    }

    async save(colaborador) {
        return await this.model.create(colaborador);
    }
  
}

module.exports = new ColaboradorRepository();
