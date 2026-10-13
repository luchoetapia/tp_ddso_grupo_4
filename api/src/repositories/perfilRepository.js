const PerfilModel = require('../database/schemas/perfilSchema.js');

class PerfilRepository {
    async findAll() {
        return await PerfilModel.find()
            .populate('habilidadesRequeridas')
            .populate('habilidadesOpcionales');
    }

    async findById(id) {
        return await PerfilModel.findById(id)
            .populate('habilidadesRequeridas')
            .populate('habilidadesOpcionales');
    }

    async save(datos) {
        const perfil = new PerfilModel(datos);
        await perfil.save();
        return await perfil.populate(['habilidadesRequeridas', 'habilidadesOpcionales']);
    }

    async update(id, datos) {
        return await PerfilModel.findByIdAndUpdate(id, datos, { new: true })
            .populate(['habilidadesRequeridas', 'habilidadesOpcionales']);
    }

    async delete(id) {
        return await PerfilModel.findByIdAndDelete(id);
    }
}

module.exports = new PerfilRepository();