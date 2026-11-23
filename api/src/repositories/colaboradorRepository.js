const ColaboradorModel = require('../database/schemas/colaboradorSchema.js');

class ColaboradorRepository {
    async buscarConPaginacion(pagina = 1, limite = 10, filtros = {}, orden = {}, datosNecesarios = null) {
        limite = Math.min(limite, 100); // Tope de documentos por página

        const [colaboradores, total] = await Promise.all([
            ColaboradorModel.find(filtros, datosNecesarios)
                .paginar({ pagina, limite, orden })
                .populate('habilidades'),
            ColaboradorModel.countDocuments(filtros)
        ]);

        return { colaboradores, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
    }

    async findAll() {
        return await ColaboradorModel.find().populate('habilidades');
    }

    async findById(id) {
        return await ColaboradorModel.findById(id).populate('habilidades');
    }

    async findByCuentaGit(cuentaGit) {
        return await ColaboradorModel.findOne({ cuentaGit }).populate('habilidades');
    }

    async findByUsuario(usuario) {
        return await ColaboradorModel.findOne({ usuario }).populate('habilidades');
    }

    async findByCondition(condition) {
        return await ColaboradorModel.find(condition).populate('habilidades');
    }

    async update(id, cambios) {
        return await ColaboradorModel.findByIdAndUpdate(id, cambios, { new: true, runValidators: true }).populate('habilidades');
    }

    async save(datos) {
        const colaborador = new ColaboradorModel(datos);
        await colaborador.save();
        return await colaborador.populate('habilidades');
    }
}

module.exports = new ColaboradorRepository();
