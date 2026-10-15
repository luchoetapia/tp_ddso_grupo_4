const mongoose = require('mongoose');
const proyectoRepository = require('../repositories/proyectoRepository.js');
const perfilService = require('./perfilService.js');
const colaboradorService = require('./colaboradorService.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

class ProyectoService {
    constructor() {
        this.proyectoRepository = proyectoRepository;
        this.perfilService = perfilService;
        this.colaboradorService = colaboradorService;
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

    proyectosActivos = async () => {
        const proyectos = await this.proyectoRepository.findAll();
        return proyectos.filter(p => !p.finalizado).map(this.toDTO);
    }

    buscarPotencialesProyectos = async (cuentaGit) => {
        const colaborador = await this.colaboradorService.obtenerPorCuentaGit(cuentaGit);
        const habilidadesColaborador = colaborador.habilidades.map(h => (h._id ?? h).toString());

        const perfiles = await this.perfilService.perfilesQueCumplenHabilidadesRequeridas(habilidadesColaborador);
        const idsPerfiles = perfiles.map(p => p.id);

        const proyectosActivos = await this.proyectosActivos();
        return proyectosActivos.filter(proyecto =>
            proyecto.perfiles.some(perfil => idsPerfiles.includes(perfil.id))
        );
    }

    perfilPerteneceAProyecto = async (idProyecto, idPerfil) => {
        const proyecto = await this.obtenerPorId(idProyecto); 
        const perfil = proyecto.perfiles.find(p => p.id === idPerfil);
        if (!perfil) {
            throw new NotFoundError("El perfil no pertenece al proyecto");
        }
        return perfil;
    }

    buscarPotencialesColaboradores = async (idProyecto, idPerfil) => {
        const perfil = await this.perfilPerteneceAProyecto(idProyecto, idPerfil);

        const colaboradores = await this.colaboradorService.obtenerTodos();
        return colaboradores.filter(colaborador =>
            perfil.cumpleHabilidadesRequeridas(colaborador.habilidades.map(h => (h._id ?? h).toString()))
        );
    }
}

module.exports = new ProyectoService();
