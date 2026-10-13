const mongoose = require('mongoose');
const proyectoRepository = require('../repositories/proyectoRepository.js');
const habilidadService = require("./habilidadService.js");
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

class ProyectoService {
    constructor() {
        this.proyectoRepository = proyectoRepository;
        this.habilidadService = habilidadService;
    }

    obtenerTodos = async () => {
        return await this.proyectoRepository.findAll()
    }

    crear = async (datos) => {
        const existente = await this.proyectoRepository.findByTitulo(datos.titulo)
        if (existente) {
            throw new ConflictError("Ya existe un proyecto con ese título")
        }

        const habilidades = await this.habilidadService.obtenerPorListaId(datos.habilidades ?? [])

        return await this.proyectoRepository.save({
            titulo: datos.titulo,
            descripcion: datos.descripcion,
            habilidades: habilidades.map(h => h._id),
            tipoCompromiso: datos.tipoCompromiso,
            modalidadColaboracion: datos.modalidadColaboracion
        })
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de proyecto inválido")
        }

        const proyecto = await this.proyectoRepository.findById(id)
        if (!proyecto) {
            throw new NotFoundError("Proyecto no encontrado")
        }
        return proyecto
    }

    obtenerPorListaId = async (listaDeIDs) => {
        const invalidos = listaDeIDs.filter(id => !mongoose.isValidObjectId(id))
        if (invalidos.length > 0) {
            throw new BadRequestError("Ids de proyecto inválidos", invalidos)
        }

        const proyectos = await this.proyectoRepository.findByIds(listaDeIDs)
        const encontrados = proyectos.map(p => p._id.toString())
        const faltantes = listaDeIDs.filter(id => !encontrados.includes(id))
        if (faltantes.length > 0) {
            throw new NotFoundError("Proyectos no encontrados", faltantes)
        }
        return proyectos
    }

    finalizar = async (id) => {
        await this.obtenerPorId(id)
        return await this.proyectoRepository.update(id, { finalizado: true })
    }
}

module.exports = new ProyectoService();
