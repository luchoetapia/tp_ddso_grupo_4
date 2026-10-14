const ColaboracionModel = require('../database/schemas/colaboracionSchema');

class ColaboracionRepository {
    constructor() {
        this.model = ColaboracionModel;
    }

    async findAll() {
        return await ColaboracionModel.find();
    }

    async save(colaboracion) {
        return await ColaboracionModel.create(colaboracion);
    }
}

module.exports = new ColaboracionRepository();
