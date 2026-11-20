const PalabraBaneada = require('../database/schemas/PalabraBaneadaSchema')

class PalabraBaneadaRepository {
    listadoPalabrasBaneadas = async () => {
        const baneadas = await PalabraBaneada.find({ activa: true }, { _id: 0, palabra: 1 });
        return baneadas.map(b => b.palabra);
    }

    listadoPalabrasBaneadasPaginadas = async (pagina = 1, limite = 10, filtros = { activa: true }, orden = { palabra: 1 }) => {
        limite = Math.min(100, limite);

        const [palabras, total] = await Promise.all(
            PalabraBaneada.find(filtros).paginar({ pagina, limite, orden }).populate('palabraBaneadas'),
            PalabraBaneada.countDocuments(filtros)
        );

        return { palabras, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
    }

    agregarPalabra = async (palabra) => {
        return await PalabraBaneada.create({ palabra, activa: true });
    }

    desactivarPalabra = async (id) => {
        return await PalabraBaneada.findOneAndUpdate({ _id: id }, { $set: { activa: false } });
    }

    activarPalabra = async (id) => {
        return await PalabraBaneada.findOneAndUpdate({ _id: id }, { $set: { activa: true } })
    }

    editarPalabra = async (id, nuevaPalabra) => {
        return await PalabraBaneada.findOneAndUpdate({ _id: id }, { $set: { palabra: nuevaPalabra } })
    }

    obtenerPalabra = async (palabra) => {
        return await PalabraBaneada.findOne({ palabra: palabra }).populate('palabraBaneadas');
    }
}

module.exports = new PalabraBaneadaRepository()