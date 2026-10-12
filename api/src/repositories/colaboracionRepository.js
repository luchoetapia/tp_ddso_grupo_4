const ColaboracionModel = require('../database/schemas/colaboracionSchema.js');

const POPULATE = [
    { path: 'colaborador', select: 'nombre apellido nombreFantasia cuentaGit' },
    { path: 'proyecto', select: 'titulo finalizado' }
];

class ColaboracionRepository {
    async findAll() {
        return await ColaboracionModel.find().populate(POPULATE);
    }

    async findActiva(idColaborador, idProyecto) {
        return await ColaboracionModel.findOne({ colaborador: idColaborador, proyecto: idProyecto, fin: null });
    }

    async save(datos) {
        const colaboracion = new ColaboracionModel(datos);
        await colaboracion.save();
        return await colaboracion.populate(POPULATE);
    }
}

module.exports = new ColaboracionRepository();
