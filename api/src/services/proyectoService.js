import { ProyectoRepsoitory } from "../repositories/proyectoRespository.js"
import { Proyecto } from "../domain/Proyecto.js"
import { ConflictError, NotFoundError } from "../errors/AppError.js"

export class ProyectoService {
    constructor(proyectoRepository = new ProyectoRepository()) {
        this.proyectoRepository = proyectoRepository;
    }

    obtenerTodos = () => {
        return this.proyectoRepository.findAll();
    }

    crear = (datos) => {
        const existente = this.proyectoRepository.findByTitulo(datos.titulo)
        if (existente) {
            throw new ConflictError("Ya existe un proyecto con ese título")
        }

        const proyecto = new Proyecto(
            datos.titulo,
            datos.tipoCompromiso,
            datos.modalidadColaboracion,
            datos.descripcion
        )

        return this.proyectoRepository.save(proyecto)
    }

    obtenerPorId = (id) => {
        const proyecto = this.proyectoRepository.findById(id)
        if (!proyecto) {
            throw new NotFoundError("Proyecto no encontrado")
        }
        return proyecto 
    }
}

