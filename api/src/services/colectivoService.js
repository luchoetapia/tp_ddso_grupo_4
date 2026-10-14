const mongoose = require('mongoose');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');
const proyectoService = require('./proyectoService.js');

class ColectivoService {
    constructor() {
        this.colectivoRepository = colectivoRepository;
        this.proyectoService = proyectoService;
    }

    toDTO = (colectivo) => {
        return {
            id: colectivo.id || colectivo._id?.toString(),
            nombre: colectivo.nombre,
            descripcion: colectivo.descripcion,
            ubicacion: colectivo.ubicacion,
            tipo: colectivo.tipo,
            proyectos: colectivo.proyectos ? colectivo.proyectos.map(p => (typeof p === 'object' && p.toDTO ? p.toDTO() : p)) : []
        };
    }

    obtenerTodos = async () => {
        const colectivos = await this.colectivoRepository.findAll();
        return colectivos.map(this.toDTO);
    }

    crear = async (datos) => {
        const existente = await this.colectivoRepository.findByNombre(datos.nombre)
        if (existente) {
            throw new ConflictError("Ya existe un colectivo con ese nombre")
        }

        const proyectos = await this.proyectoService.obtenerPorListaId(datos.proyectos ?? [])

        const creado = await this.colectivoRepository.save({
            nombre: datos.nombre,
            descripcion: datos.descripcion,
            ubicacion: datos.ubicacion,
            tipo: datos.tipo,
            proyectos: proyectos.map(p => p._id)
        })
        return this.toDTO(creado);
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de colectivo inválido")
        }

        const colectivo = await this.colectivoRepository.findById(id)
        if (!colectivo) {
            throw new NotFoundError("Colectivo no encontrado")
        }
        return this.toDTO(colectivo)
    }

    finalizarProyecto = async (idColectivo, idProyecto) => {
        await this.obtenerPorId(idColectivo)
        return await this.proyectoService.finalizar(idProyecto)
    }
}

module.exports = new ColectivoService();
