const { ColectivoRepository } = require('../repositories/colectivoRepository.js');
const { Colectivo } = require('../models/dominio.js');
const { ConflictError, NotFoundError } = require('../errors/AppError.js');

class ColectivoService {
    constructor(colectivoRepository = new ColectivoRepository()) {
        this.colectivoRepository = colectivoRepository;
    }

    obtenerTodos = () => {
        return this.colectivoRepository.findAll();
    }

    crear = (datos) => {
        const existente = this.colectivoRepository.findByNombre(datos.nombre)
        if (existente) {
            throw new ConflictError("Ya existe un colectivo con ese nombre")
        }

        const colectivo = new Colectivo(
            datos.id,
            datos.nombre,
            datos.descripcion,
            datos.ubicacion,
            datos.tipo,
            datos.proyectos
        )

        return this.colectivoRepository.save(colectivo)
    }

    obtenerPorId = (id) => {
        const colectivo = this.colectivoRepository.findById(id)
        if (!colectivo) {
            throw new NotFoundError("Colectivo no encontrado")
        }
        return colectivo
    }
}

module.exports = { ColectivoService };
