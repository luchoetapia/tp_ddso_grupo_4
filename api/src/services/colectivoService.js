import { ColectivoRepository } from "../repositories/colectivoRepository.js"
import { Colectivo } from "../domain/Colectivo.js"
import { ConflictError, NotFoundError } from "../errors/AppError.js"

export class ColectivoService {
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
