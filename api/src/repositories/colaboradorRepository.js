const ColaboradorModel = require('../database/schemas/colaboradorSchema');

class ColaboradorRepository {

    constructor() {
        this.model = ColaboradorModel;
    }

    findAll() {
        return this.model.find();
    }

    findByID(idBuscado) {
        return this.model.findById(idBuscado);
    }

    findByCuentaGit(cuentaGit) {
        return this.model.findOne({ cuentaGit: cuentaGit });
    }

    save(colaborador) {
        return this.model.create(colaborador);
    }
  
}

module.exports = new ColaboradorRepository();
