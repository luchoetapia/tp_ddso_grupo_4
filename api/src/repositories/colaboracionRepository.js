const ColaboracionModel = require('../database/schemas/colaboracionSchema');

class ColaboracionRepository {
    constructor() {
        this.model = ColaboracionModel;
    }

    async findAll() {
        return await ColaboracionModel.find();
    }

    async findActiva(idColaborador, idProyecto) {
        return await ColaboracionModel.findOne({ colaborador: idColaborador, proyecto: idProyecto, fin: null });
    }

    async findByProyectoID(idProyecto) {
        return await ColaboracionModel.find({proyecto: idProyecto});
    }

    async save(colaboracion) {
        return await ColaboracionModel.create(colaboracion);
    }
}

module.exports = new ColaboracionRepository();
