const mongoose = require('mongoose');
const proyectoRepository = require('../repositories/proyectoRepository.js');
const habilidadService = require('./habilidadService.js');
const colaboradorService = require('./colaboradorService.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

class ProyectoService {
    constructor() {
        this.proyectoRepository = proyectoRepository;
        this.habilidadService = habilidadService;
        this.colaboradorService = colaboradorService;
        this.colectivoRepository = colectivoRepository;
    }

    obtenerTodos = async () => {
        const proyectos = await this.proyectoRepository.findAll();
        return proyectos;
    }

    crear = async (datos, idUsuario = null) => {
        const existente = await this.proyectoRepository.findByTitulo(datos.titulo)
        if (existente) {
            throw new ConflictError("Ya existe un proyecto con ese título")
        }

        let colectivo = null;
        if (idUsuarioColectivo) {
        colectivo = await this.colectivoRepository.findByUsuario(idUsuarioColectivo);
        if (!colectivo)
            throw new NotFoundError("El usuario no tiene un colectivo registrado");
        }

        // Los perfiles se embeben en el proyecto: solo hay que validar que existan sus habilidades
        await this.validarHabilidadesDePerfiles(datos.perfiles ?? []);

        const creado = await this.proyectoRepository.save({
            titulo: datos.titulo,
            descripcion: datos.descripcion,
            perfiles: datos.perfiles ?? [],
            enlaceSistema: datos.enlaceSistema ?? null,
            enlaceCodigoFuente: datos.enlaceCodigoFuente ?? null
        });

        if (colectivo)
            await this.colectivoRepository.update(colectivo.id, { $push: { proyectos: creado.id } });

        return creado;
    }

    obtenerPorId = async (id, proyeccion) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de proyecto inválido")
        }

        const proyecto = await this.proyectoRepository.findById(id, proyeccion)
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
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de proyecto inválido")
        }

        const actualizado = await this.proyectoRepository.update(id, { finalizado: true });
        if (!actualizado) {
            throw new NotFoundError("Proyecto no encontrado")
        }
        return actualizado;
    }

    proyectosActivos = async () => {
        return await this.proyectoRepository.obtenerActivos();
    }

    puedeAplicar = async (idProyecto, idsHabilidades) => {
        const proyecto = await this.obtenerPorId(idProyecto, { finalizado: 1, perfiles: 1 });
        if (proyecto.finalizado) return false;
        
        const perfiles = proyecto.obtenerPerfilesQueCumplen(idsHabilidades);
        return perfiles.length > 0;
    }

    ordenarPorCantidadHabilidadesCumplidas = (proyectos, idsHabilidades) => {
        // Ordena los proyectos por la cantidad de perfiles que cumplen con las habilidades dadas. 
        // En caso de empate, por la cantidad total de habilidades cumplidas
        return proyectos.sort((a, b) => {
            const perfilesA = a.obtenerPerfilesQueCumplen(idsHabilidades);
            const perfilesB = b.obtenerPerfilesQueCumplen(idsHabilidades);

            if (perfilesA.length !== perfilesB.length) 
                return perfilesB.length - perfilesA.length; // Orden descendente por cantidad de perfiles que cumplen

            const cantidadA = a.obtenerCantidadHabilidadesCumplidas(idsHabilidades, perfilesA);
            const cantidadB = b.obtenerCantidadHabilidadesCumplidas(idsHabilidades, perfilesB);

            return cantidadB - cantidadA; // Orden descendente
        })
    }

    buscarPotencialesProyectos = async (idsHabilidades) => {
        // Busco proyectos activos que tengan perfiles que requieran las habilidades dadas
        const condicion = {
            finalizado: false,
            perfiles: { 
                $elemMatch: {
                    busquedaAbierta: true,
                    habilidadesRequeridas: { $not: { $elemMatch: { $nin: idsHabilidades } } }
                } 
            } 
        }
        
        const proyectos = await this.proyectoRepository.findByCondition(condicion);
        return this.ordenarPorCantidadHabilidadesCumplidas(proyectos, idsHabilidades);
    }

    perfilPerteneceAProyecto = async (idProyecto, idPerfil) => {
        const perfil = await this.proyectoRepository.obtenerPerfil(idProyecto, idPerfil);
        if (!perfil) throw new NotFoundError("El perfil no pertenece al proyecto especificado");

        return perfil;
    }

    buscarPotencialesColaboradores = async (idProyecto, idPerfil) => {
        const perfil = await this.perfilPerteneceAProyecto(idProyecto, idPerfil);

        const colaboradores = await this.colaboradorService.obtenerColaboradoresPotenciales([perfil]);
        return colaboradores;
    }

    // ---------- Perfiles (subdocumentos del proyecto) ----------

    validarHabilidadesDePerfiles = async (perfiles) => {
        // Junta las habilidades de todos los perfiles para validarlas en una sola consulta
        const idsHabilidades = new Set(
            perfiles.flatMap(perfil => [
                ...(perfil.habilidadesRequeridas ?? []),
                ...(perfil.habilidadesOpcionales ?? [])
            ])
        );
        if (idsHabilidades.size > 0) {
            await this.habilidadService.obtenerPorListaId([...idsHabilidades]);
        }
    }

    obtenerPerfiles = async (idProyecto) => {
        const perfiles = await this.proyectoRepository.obtenerPerfiles(idProyecto);
        if (!perfiles) throw new NotFoundError("Proyecto no encontrado");

        return perfiles;
    }

    agregarPerfil = async (idProyecto, datos) => {
        await this.validarHabilidadesDePerfiles([datos]);

        const proyecto = await this.proyectoRepository.agregarPerfil(idProyecto, datos);
        if (!proyecto) throw new NotFoundError("Proyecto no encontrado");

        return proyecto.perfiles.at(-1);
    }

    modificarPerfil = async (idProyecto, idPerfil, cambios) => {
        await this.validarHabilidadesDePerfiles([cambios]);

        const proyecto = await this.proyectoRepository.modificarPerfil(idProyecto, idPerfil, cambios);
        if (!proyecto) throw new NotFoundError("Proyecto o perfil no encontrado");

        return proyecto.perfiles.id(idPerfil);
    }

    eliminarPerfil = async (idProyecto, idPerfil) => {
        const proyecto = await this.proyectoRepository.eliminarPerfil(idProyecto, idPerfil);
        if (!proyecto) throw new NotFoundError("Proyecto o perfil no encontrado");
    }

    finalizarVariosProyectos = async (idsProyectos) => {
        const setQuery = { finalizado: true };
        const resultado = await this.proyectoRepository.updateMultiple(idsProyectos, setQuery);

        return resultado.modifiedCount;
    }
}

module.exports = new ProyectoService();
