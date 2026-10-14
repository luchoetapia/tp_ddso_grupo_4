const ColaboradorModel = require('../database/schemas/colaboradorSchema.js');

class ColaboradorRepository {
    async findAll() {
        return await ColaboradorModel.find().populate('habilidades');
    }

    async findById(id) {
        return await ColaboradorModel.findById(id).populate('habilidades');
    }

    async findByCuentaGit(cuentaGit) {
        return await ColaboradorModel.findOne({ cuentaGit }).populate('habilidades');
    }

    async findByHabilidades(idsHabilidades) {
        const filtro = idsHabilidades.length > 0 ? { habilidades: { $all: idsHabilidades } } : {};
        return await ColaboradorModel.find(filtro).select('-contactos').populate('habilidades');
    }

    async save(datos) {
        const colaborador = new ColaboradorModel(datos);
        await colaborador.save();
        return await colaborador.populate('habilidades');
    }
}

module.exports = new ColaboradorRepository();
