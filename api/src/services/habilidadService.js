const habilidadRepository = require('../repositories/habilidadRepository.js');
const { Habilidad } = require('../models/dominio.js');
const { ConflictError, NotFoundError } = require('../errors/AppError.js');

class HabilidadService {
    constructor() {
        this.habilidadRepository = habilidadRepository;
    }

    crear = (datos) => {
        const existente = this.habilidadRepository.findByTitulo(datos.titulo)
        if (existente) {
            throw new ConflictError("Ya existe una habilidad con ese título")
        }

        const habilidad = new Habilidad(
            datos.id,
            datos.titulo,
            datos.tipoHabilidad,
            datos.descripcion
        )

        return this.habilidadRepository.save(habilidad)
    }

    obtenerPorId = (id) => {
        const habilidad = this.habilidadRepository.findById(id)
        if (!habilidad) {
            throw new NotFoundError("Habilidad no encontrada")
        }
        return habilidad
    }

    obtenerPorListaId = (listaDeIDs) => {
        return listaDeIDs.map(idHabilidad => this.obtenerPorId(idHabilidad))
    } 

}

module.exports = new HabilidadService();
