const proyectoRepository = require('../repositories/proyectoRepository.js');
const habilidadeService = require("./habilidadService.js");
const { Proyecto } = require('../models/dominio.js');
const { ConflictError, NotFoundError } = require('../errors/AppError.js');

class ProyectoService {
    constructor() {
        this.proyectoRepository = proyectoRepository;
        this.habilidadeService = habilidadeService;
    }

    obtenerTodos = () => {
        return this.proyectoRepository.findAll();
    }

    crear = (datos) => {
        const existente = this.proyectoRepository.findByTitulo(datos.titulo)
        if (existente) {
            throw new ConflictError("Ya existe un proyecto con ese título")
        }

        const habilidadesDelProyecto = this.habilidadeService.obtenerPorListaId(datos.habilidades);

        const proyecto = new Proyecto(
            datos.id,
            datos.titulo,
            datos.descripcion,
            habilidadesDelProyecto,
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

    finalizar = (id) => {
        const proyecto = this.obtenerPorId(id)
        proyecto.finalizado = true
        return proyecto
    }
}

module.exports = new ProyectoService();
