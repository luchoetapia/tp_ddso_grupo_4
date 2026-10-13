const ColaboracionModel = require('../database/schemas/colaboracionSchema');

class ColaboracionRepository {
    constructor() {
        this.model = ColaboracionModel;
    }

    async findAll() {
        return await this.model.find();
    }

    async save(colaboracion) {
        return await this.model.create(colaboracion);
    }
}

module.exports = new ColaboracionRepository();
