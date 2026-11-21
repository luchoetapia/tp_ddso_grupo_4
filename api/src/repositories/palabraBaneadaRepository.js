const PalabraBaneada = require('../database/schemas/PalabraBaneadaSchema')

class PalabraBaneadaRepository {
    listadoPalabrasBaneadas = async () => {
        const baneadas = await PalabraBaneada.find({ activa: true }, { _id: 0, palabra: 1 });
        return baneadas.map(b => b.palabra);
    }

    listadoPalabrasBaneadasPaginadas = async (pagina = 1, limite = 10, filtros = {}, orden = { palabra: 1 }) => {
        limite = Math.min(100, limite);

        const [palabras, total] = await Promise.all([
            PalabraBaneada.find(filtros).paginar({ pagina, limite, orden }),
            PalabraBaneada.countDocuments(filtros)
        ]);

        return { palabras, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
    }

    agregarPalabra = async (palabra) => {
        return await PalabraBaneada.create({ palabra, activa: true });
    }

    desactivarPalabra = async (id) => {
        return await PalabraBaneada.findByIdAndUpdate(id, { $set: { activa: false } }, { new: true });
    }

    activarPalabra = async (id) => {
        return await PalabraBaneada.findByIdAndUpdate(id, { $set: { activa: true } }, { new: true });
    }

    editarPalabra = async (id, nuevaPalabra) => {
        return await PalabraBaneada.findByIdAndUpdate(id, { $set: { palabra: nuevaPalabra } }, { new: true });
    }

    obtenerPalabra = async (palabra) => {
        return await PalabraBaneada.findOne({ palabra: palabra });
    }
}

module.exports = new PalabraBaneadaRepository()
