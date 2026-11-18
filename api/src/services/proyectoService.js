const mongoose = require('mongoose');
const proyectoRepository = require('../repositories/proyectoRepository.js');
const habilidadService = require('./habilidadService.js');
const colaboradorService = require('./colaboradorService.js');
const { obtenerEstrategia } = require('../models/Proyecto/EsrtategiaAceptacion/index.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');
const { construirOrden } = require('./ordenamiento.js');

// Claves por las que el front puede ordenar los proyectos (2° criterio: título, 3°: _id)
const ORDENAMIENTO = {
    campos: {
        titulo: 'titulo',
        fechaCreacion: 'createdAt',
        porcentajeFinalizado: 'porcentajeFinalizado',
    },
    campoNombre: 'titulo',
    porDefecto: { orden: 'fechaCreacion', direccion: 'desc' },
};

// Orden extra de la búsqueda de potenciales proyectos: ranking calculado en JS (no es un campo del documento)
const ORDEN_RELEVANCIA = 'relevancia';

// Ventana para considerar "reciente" a un proyecto en los destacados del home
const DIAS_RECIENTE = 30;

class ProyectoService {
    constructor() {
        this.proyectoRepository = proyectoRepository;
        this.habilidadService = habilidadService;
        this.colaboradorService = colaboradorService;
        this.colectivoRepository = colectivoRepository;
    }

    buscar = async (filtros = {}, { pagina, limite, orden, direccion } = {}) => {
        const condicion = await this.condicionDeFiltros(filtros);
        const sort = construirOrden(ORDENAMIENTO, { orden, direccion });
        return await this.proyectoRepository.buscarConPaginacion(pagina, limite, condicion, sort);
    }

    condicionDeFiltros = async ({ texto, habilidades, finalizado } = {}) => {
        const condiciones = [];

        if (finalizado !== undefined) condiciones.push({ finalizado });

        if (habilidades?.length) {
            condiciones.push({
                perfiles: {
                    $elemMatch: {
                        busquedaAbierta: true,
                        $or: [
                            { habilidadesRequeridas: { $in: habilidades } },
                            { habilidadesOpcionales: { $in: habilidades } },
                        ],
                    },
                },
            });
        }

        if (texto) {
            // Escapo caracteres especiales para que el texto se busque literal y no como regex
            const coincide = { $regex: texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
            const idsHabilidades = await this.habilidadService.idsPorTitulo(texto);
            condiciones.push({
                $or: [
                    { titulo: coincide },
                    { descripcion: coincide },
                    { 'perfiles.habilidadesRequeridas': { $in: idsHabilidades } },
                    { 'perfiles.habilidadesOpcionales': { $in: idsHabilidades } },
                ],
            });
        }

        if (condiciones.length === 0) return {};
        return condiciones.length === 1 ? condiciones[0] : { $and: condiciones };
    }

    crear = async (datos, idUsuarioColectivo = null) => {
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

        if (datos.estrategiaAceptacion) {
            const estrategiaInstancia = obtenerEstrategia(datos.estrategiaAceptacion);
            const dummy = { perfiles: datos.perfiles ?? [] };
            if (!estrategiaInstancia.aplicableAProyecto(dummy)) {
                throw new ConflictError(`La estrategia '${estrategiaInstancia.nombre}' no es aplicable a este proyecto`);
            }
        }

        const payload = {
            titulo: datos.titulo,
            descripcion: datos.descripcion,
            perfiles: datos.perfiles ?? [],
            enlaceSistema: datos.enlaceSistema ?? null,
            enlaceCodigoFuente: datos.enlaceCodigoFuente ?? null
        };
        if (datos.estrategiaAceptacion) {
            payload.estrategiaAceptacion = datos.estrategiaAceptacion;
        }

        const creado = await this.proyectoRepository.save(payload);

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

    // Ranking de relevancia: 1° cantidad de perfiles que cumple, 2° cantidad de habilidades cumplidas
    // (ambos según la dirección; desc = más relevantes primero). Empates: título alfabético y después id
    ordenarPorCantidadHabilidadesCumplidas = (proyectos, idsHabilidades, direccion = 'desc') => {
        const sentido = direccion === 'asc' ? 1 : -1;

        return proyectos.sort((a, b) => {
            const perfilesA = a.obtenerPerfilesQueCumplen(idsHabilidades);
            const perfilesB = b.obtenerPerfilesQueCumplen(idsHabilidades);

            if (perfilesA.length !== perfilesB.length)
                return sentido * (perfilesA.length - perfilesB.length);

            const cantidadA = a.obtenerCantidadHabilidadesCumplidas(idsHabilidades, perfilesA);
            const cantidadB = b.obtenerCantidadHabilidadesCumplidas(idsHabilidades, perfilesB);
            if (cantidadA !== cantidadB)
                return sentido * (cantidadA - cantidadB);

            return (a.titulo ?? '').localeCompare(b.titulo ?? '') || String(a.id).localeCompare(String(b.id));
        })
    }

    // Con orden 'relevancia' (default) se pagina en memoria: el ranking se calcula en JS, así que hay que traer
    // todos los candidatos, ordenarlos y recién ahí cortar la página.
    // Con cualquier otro orden el filtro y el orden se expresan en la query: se pagina directo en la BD.
    // filtros: texto y habilidades, igual que en el listado (ver condicionDeFiltros)
    buscarPotencialesProyectos = async (idsHabilidades, { pagina = 1, limite = 10, orden = ORDEN_RELEVANCIA, direccion } = {}, filtros = {}) => {
        const cumplible = {
            finalizado: false,
            perfiles: {
                $elemMatch: {
                    busquedaAbierta: true,
                    $or: [{ fechaFinBusqueda: null }, { fechaFinBusqueda: { $gt: new Date() } }],
                    habilidadesRequeridas: { $not: { $elemMatch: { $nin: idsHabilidades } } }
                }
            }
        }

        const extra = await this.condicionDeFiltros({ texto: filtros.texto, habilidades: filtros.habilidades });
        const condicion = Object.keys(extra).length ? { $and: [cumplible, extra] } : cumplible;

        if (orden !== ORDEN_RELEVANCIA) {
            const sort = construirOrden(ORDENAMIENTO, { orden, direccion });
            return await this.proyectoRepository.buscarConPaginacion(pagina, limite, condicion, sort);
        }

        const candidatos = await this.proyectoRepository.findByCondition(condicion);
        const ordenados = this.ordenarPorCantidadHabilidadesCumplidas(candidatos, idsHabilidades, direccion);

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

    // Destacados del home, entre los proyectos activos creados en los últimos DIAS_RECIENTE días:
    // el más nuevo, el de mayor progreso y el de más perfiles.
    proyectosDestacados = async (soloId = false) => {
        const fechaLimite = new Date(Date.now() - DIAS_RECIENTE * 24 * 60 * 60 * 1000);

        const [masReciente, mayorProgreso, masPerfiles] = await Promise.all([
            this.proyectoRepository.masReciente(fechaLimite),
            this.proyectoRepository.mayorProgreso(fechaLimite),
            this.proyectoRepository.masPerfiles(fechaLimite)
        ]);

        // Un proyecto puede ganar más de una categoría, pero aparece una sola vez
        const destacados = new Map();
        for (const proyecto of [masReciente, mayorProgreso, masPerfiles]) {
            if (proyecto) destacados.set(proyecto.id, proyecto);
        }

        const lista = [...destacados.values()];
        return soloId ? lista.map(proyecto => proyecto.id) : lista;
    }
}

module.exports = new ProyectoService();
