const ColaboradorModel = require('../database/schemas/colaboradorSchema.js');

class ColaboradorRepository {
    async buscarConPaginacion(pagina = 1, limite = 10, filtros = {}, orden = {}, datosNecesarios = null) {
        limite = Math.min(limite, 100); // Tope de documentos por página

        const [colaboradores, total] = await Promise.all([
            ColaboradorModel.find(filtros, datosNecesarios)
                .paginar({ pagina, limite, orden })
                .populate('habilidades')
                .populate('usuario', 'activo'),
            ColaboradorModel.countDocuments(filtros)
        ]);

        return { colaboradores, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
    }

    async findAll() {
        return await ColaboradorModel.find().populate('habilidades').populate('usuario', 'activo');
    }

    async findById(id) {
        return await ColaboradorModel.findById(id).populate('habilidades').populate('usuario', 'activo');
    }

    async findByCuentaGit(cuentaGit) {
        return await ColaboradorModel.findOne({ cuentaGit }).populate('habilidades').populate('usuario', 'activo');
    }

    async findByUsuario(usuario) {
        return await ColaboradorModel.findOne({ usuario }).populate('habilidades').populate('usuario', 'activo');
    }

    async findByCondition(condition) {
        return await ColaboradorModel.find(condition).populate('habilidades').populate('usuario', 'activo');
    }

    async save(datos) {
        const colaborador = new ColaboradorModel(datos);
        await colaborador.save();
        return await colaborador.populate(['habilidades', { path: 'usuario', select: 'activo' }]);
    }

    async anonymize(id) {
        return ColaboradorModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    nombre: null,
                    apellido: null,
                    nombreFantasia: 'UsuarioEliminado',
                    pronombres: null,
                    presentacion: null,
                    deseaSerContactado: false,
                    contactos: [],
                },
            },
            { new: true }
        );
    }
}

module.exports = new ColaboradorRepository();
