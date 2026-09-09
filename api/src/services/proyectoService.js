const { ProyectoRepository } = require('../repositories/proyectoRepository.js');
const { Proyecto } = require('../models/dominio.js');
const { ConflictError, NotFoundError } = require('../errors/AppError.js');

class ProyectoService {
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
            datos.id,
            datos.titulo,
            datos.descripcion,
            datos.habilidades,
            datos.tipoCompromiso,
            datos.modalidadColaboracion
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

module.exports = { ProyectoService };
