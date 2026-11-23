const AuditoriaModel = require('../database/schemas/auditoriaSchema.js');

class AuditoriaRepository {
    async save(datos) {
        return await AuditoriaModel.create(datos);
    }

    // Más recientes primero
    async buscarConPaginacion(pagina = 1, limite = 10, filtros = {}, orden = { fecha: -1, _id: -1 }) {
        limite = Math.min(limite, 100);

        const [registros, total] = await Promise.all([
            AuditoriaModel.find(filtros).paginar({ pagina, limite, orden }),
            AuditoriaModel.countDocuments(filtros)
        ]);

        return { registros, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
    }
}

module.exports = new AuditoriaRepository();
