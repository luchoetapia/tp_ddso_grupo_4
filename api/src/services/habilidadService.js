const mongoose = require('mongoose');
const habilidadRepository = require('../repositories/habilidadRepository.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

const { construirOrden } = require('./ordenamiento.js');

// Claves por las que el front puede ordenar las habilidades (2° criterio: título, 3°: _id)
const ORDENAMIENTO = {
    campos: {
        titulo: 'titulo',
        tipoHabilidad: 'tipoHabilidad',
    },
    campoNombre: 'titulo',
    porDefecto: { orden: 'titulo', direccion: 'asc' },
};

class HabilidadService {
    constructor() {
        this.habilidadRepository = habilidadRepository;
    }

    obtenerTodas = async ({ pagina, limite, orden, direccion } = {}) => {
        const sort = construirOrden(ORDENAMIENTO, { orden, direccion });
        return await this.habilidadRepository.buscarConPaginacion(pagina, limite, {}, sort);
    }

    crear = async (datos) => {
        const existente = await this.habilidadRepository.findByTitulo(datos.titulo)
        if (existente) {
            throw new ConflictError("Ya existe una habilidad con ese título")
        }

        const creada = await this.habilidadRepository.save({
            titulo: datos.titulo,
            tipoHabilidad: datos.tipoHabilidad,
            descripcion: datos.descripcion
        })
        return creada;
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de habilidad inválido")
        }

        const habilidad = await this.habilidadRepository.findById(id)
        if (!habilidad) {
            throw new NotFoundError("Habilidad no encontrada")
        }
        return habilidad
    }

    obtenerPorListaId = async (listaDeIDs) => {
        const invalidos = listaDeIDs.filter(id => !mongoose.isValidObjectId(id))
        if (invalidos.length > 0) {
            throw new BadRequestError("Ids de habilidad inválidos", invalidos)
        }

        const habilidades = await this.habilidadRepository.findByIds(listaDeIDs)
        const encontrados = habilidades.map(h => h._id.toString())
        const faltantes = listaDeIDs.filter(id => !encontrados.includes(id))
        if (faltantes.length > 0) {
            throw new NotFoundError("Habilidades no encontradas", faltantes)
        }
        return habilidades
    }
}

module.exports = new HabilidadService();
