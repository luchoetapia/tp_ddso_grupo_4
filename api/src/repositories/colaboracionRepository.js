const ColaboracionModel = require('../database/schemas/colaboracionSchema');

// Datos mínimos del colaborador y del proyecto para la vista pública de la colaboración
const REFERENCIAS = [
    { path: 'colaborador', select: 'cuentaGit' },
    { path: 'proyecto', select: 'titulo' }
];

class ColaboracionRepository {
    constructor() {
        this.model = ColaboracionModel;
    }

    async findAll() {
        return await ColaboracionModel.find().populate(REFERENCIAS);
    }

    async findActiva(idColaborador, idProyecto) {
        return await ColaboracionModel.findOne({ colaborador: idColaborador, proyecto: idProyecto, fin: null });
    }

    async save(colaboracion) {
        const creada = await ColaboracionModel.create(colaboracion);
        return await creada.populate(REFERENCIAS);
    }

    async findById(id) {
        return await ColaboracionModel.findById(id).populate(REFERENCIAS);
    }

    async cerrar(id, fin) {
        return await ColaboracionModel.findOneAndUpdate({ _id: id, fin: null }, { fin }, { new: true }).populate(REFERENCIAS);
    }

}

module.exports = new ColaboracionRepository();
