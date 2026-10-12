const mongoose = require('mongoose');
const habilidadRepository = require('../repositories/habilidadRepository.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

class HabilidadService {
    constructor() {
        this.habilidadRepository = habilidadRepository;
    }

    obtenerTodas = async () => {
        return await this.habilidadRepository.findAll()
    }

    crear = async (datos) => {
        const existente = await this.habilidadRepository.findByTitulo(datos.titulo)
        if (existente) {
            throw new ConflictError("Ya existe una habilidad con ese título")
        }

        return await this.habilidadRepository.save({
            titulo: datos.titulo,
            tipoHabilidad: datos.tipoHabilidad,
            descripcion: datos.descripcion
        })
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
