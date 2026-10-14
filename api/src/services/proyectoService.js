const mongoose = require('mongoose');
const proyectoRepository = require('../repositories/proyectoRepository.js');
const perfilService = require('./perfilService.js');
const perfilService = require('./perfilService.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

class ProyectoService {
    constructor() {
        this.proyectoRepository = proyectoRepository;
        this.perfilService = perfilService;
        this.perfilService = perfilService;
    }

    toDTO = (proyecto) => {
        return {
            id: proyecto.id || proyecto._id?.toString(),
            titulo: proyecto.titulo,
            descripcion: proyecto.descripcion,
            perfiles: proyecto.perfiles ? proyecto.perfiles.map(p => (typeof p === 'object' && p.toDTO ? p.toDTO() : p)) : [],
            finalizado: proyecto.finalizado ?? false,
            porcentajeFinalizado: proyecto.porcentajeFinalizado ?? 0,
            enlaceSistema: proyecto.enlaceSistema,
            enlaceCodigoFuente: proyecto.enlaceCodigoFuente,
            logros: proyecto.logros ? proyecto.logros.map(l => (typeof l === 'object' && l.toDTO ? l.toDTO() : l)) : []
        };
    }

    obtenerTodos = async () => {
        const proyectos = await this.proyectoRepository.findAll();
        return proyectos.map(this.toDTO);
    }

    crear = async (datos) => {
        const existente = await this.proyectoRepository.findByTitulo(datos.titulo)
        if (existente) {
            throw new ConflictError("Ya existe un proyecto con ese título")
        }

        if (datos.perfiles && datos.perfiles.length > 0) {
            for (const perfilId of datos.perfiles) {
                await this.perfilService.obtenerPorId(perfilId);
            }
        }
        if (datos.perfiles && datos.perfiles.length > 0) {
            for (const perfilId of datos.perfiles) {
                await this.perfilService.obtenerPorId(perfilId);
            }
        }

        const creado = await this.proyectoRepository.save({
            titulo: datos.titulo,
            descripcion: datos.descripcion,
            perfiles: datos.perfiles ?? [],
            enlaceSistema: datos.enlaceSistema ?? null,
            enlaceCodigoFuente: datos.enlaceCodigoFuente ?? null
        });

        return this.toDTO(creado);
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de proyecto inválido")
        }

        const proyecto = await this.proyectoRepository.findById(id)
        if (!proyecto) {
            throw new NotFoundError("Proyecto no encontrado")
        }
        return this.toDTO(proyecto)
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
        return proyectos.map(this.toDTO)
    }

    finalizar = async (id) => {
        await this.obtenerPorId(id)
        const actualizado = await this.proyectoRepository.update(id, { finalizado: true });
        return this.toDTO(actualizado);
    }
}

module.exports = new ProyectoService();
