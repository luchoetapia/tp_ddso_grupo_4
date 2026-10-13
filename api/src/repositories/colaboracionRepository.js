const ColaboracionModel = require('../database/schemas/colaboracionSchema');

class ColaboracionRepository {
    constructor() {
        this.model = ColaboracionModel;
    }

    findAll() {
        return this.model.find();
    }

    save(colaboracion) {
        return this.model.create(colaboracion);
    }
}

module.exports = new ColaboracionRepository();
