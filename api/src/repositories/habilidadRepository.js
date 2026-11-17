const HabilidadModel = require('../database/schemas/habilidadSchema.js');

class HabilidadRepository {
    async buscarConPaginacion(pagina = 1, limite = 10, filtros = {}, orden = {}, datosNecesarios = null) {
        limite = Math.min(limite, 100); // Tope de documentos por página

        const [habilidades, total] = await Promise.all([
            HabilidadModel.find(filtros, datosNecesarios)
                .paginar({ pagina, limite, orden }),
            HabilidadModel.countDocuments(filtros)
        ]);

        return { habilidades, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
    }

    async findAll() {
        return await HabilidadModel.find();
    }

    async findByTitulo(titulo) {
        return await HabilidadModel.findOne({ titulo });
    }

    async findById(id) {
        return await HabilidadModel.findById(id);
    }

    // Ids de las habilidades cuyo título contiene el texto (sin distinguir mayúsculas)
    async idsPorTitulo(regexTitulo) {
        const habilidades = await HabilidadModel.find({ titulo: regexTitulo }, '_id');
        return habilidades.map((h) => h._id);
    }

    async findByIds(ids) {
        return await HabilidadModel.find({ _id: { $in: ids } });
    }

    async save(datos) {
        const habilidad = new HabilidadModel(datos);
        return await habilidad.save();
    }
}

module.exports = new HabilidadRepository();
