const mongoose = require('mongoose');
const proyectoRepository = require('../repositories/proyectoRepository.js');
const habilidadService = require('./habilidadService.js');
const colaboradorService = require('./colaboradorService.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

// Orden de los listados: más recientes primero (el _id de Mongo crece con la fecha de creación)
const ORDEN_LISTADO = { _id: -1 };

class ProyectoService {
    constructor() {
        this.proyectoRepository = proyectoRepository;
        this.habilidadService = habilidadService;
        this.colaboradorService = colaboradorService;
        this.colectivoRepository = colectivoRepository;
    }

    obtenerTodos = async ({ pagina, limite } = {}) => {
        return await this.proyectoRepository.buscarConPaginacion(pagina, limite, {}, ORDEN_LISTADO);
    }

    buscarPorTexto = async (texto, { pagina, limite } = {}) => {
        // Escapo caracteres especiales para que el texto se busque literal y no como regex
        const textoRegex = texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const coincide = { $regex: textoRegex, $options: 'i' };

        const condicion = {
            $or: [
                { titulo: coincide },
                { descripcion: coincide },
            ]
        };

        return await this.proyectoRepository.buscarConPaginacion(pagina, limite, condicion, ORDEN_LISTADO);
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

    // Se pagina en memoria (no en la BD) porque el orden depende de un ranking calculado en JS
    // (perfiles que cumple y habilidades cumplidas): hay que traer todos los candidatos, ordenarlos y recién ahí cortar la página
    buscarPotencialesProyectos = async (idsHabilidades, { pagina = 1, limite = 10 } = {}) => {
        const condicion = {
            finalizado: false,
            perfiles: {
                $elemMatch: {
                    busquedaAbierta: true,
                    $or: [{ fechaFinBusqueda: null }, { fechaFinBusqueda: { $gt: new Date() } }],
                    habilidadesRequeridas: { $not: { $elemMatch: { $nin: idsHabilidades } } }
                }
            }
        }
        
        const candidatos = await this.proyectoRepository.findByCondition(condicion);
        const ordenados = this.ordenarPorCantidadHabilidadesCumplidas(candidatos, idsHabilidades);

        const inicio = (pagina - 1) * limite;
        return {
            proyectos: ordenados.slice(inicio, inicio + limite),
            total: ordenados.length,
            pagina,
            limite,
            totalPaginas: Math.ceil(ordenados.length / limite)
        };
    }

    perfilPerteneceAProyecto = async (idProyecto, idPerfil) => {
        const perfil = await this.proyectoRepository.obtenerPerfil(idProyecto, idPerfil);
        if (!perfil) throw new NotFoundError("El perfil no pertenece al proyecto especificado");

        return perfil;
    }

    buscarPotencialesColaboradores = async (idProyecto, idPerfil, paginacion = {}) => {
        const perfil = await this.perfilPerteneceAProyecto(idProyecto, idPerfil);

        return await this.colaboradorService.obtenerColaboradoresPotenciales([perfil], paginacion);
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
