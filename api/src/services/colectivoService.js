const mongoose = require('mongoose');
const { BadRequestError, ConflictError, ForbiddenError, NotFoundError } = require('../errors/AppError.js');
const { roles } = require('../auth/models/usuario.js');

const colectivoRepository = require('../repositories/colectivoRepository.js');
const colaboracionRepository = require('../repositories/colaboracionRepository.js');
const postulacionRepository = require('../repositories/postulacionRepository.js');

const proyectoService = require('./proyectoService.js');
const colaboradorService = require('./colaboradorService.js');

const { construirOrden } = require('./ordenamiento.js');

// Claves por las que el front puede ordenar los colectivos (2° criterio: nombre, 3°: _id)
const ORDENAMIENTO = {
    campos: {
        nombre: 'nombre',
        tipo: 'tipo',
    },
    campoNombre: 'nombre',
    porDefecto: { orden: 'nombre', direccion: 'asc' },
};

const MENSAJE_USUARIO_CON_COLECTIVO = "El usuario ya tiene un colectivo asociado";

class ColectivoService {
    constructor() {
        this.colectivoRepository = colectivoRepository;
        this.colaboracionRepository = colaboracionRepository;
        this.postulacionRepository = postulacionRepository;
        this.proyectoService = proyectoService;
        this.colaboradorService = colaboradorService;
    }

    obtenerTodos = async ({ pagina, limite, orden, direccion } = {}) => {
        const sort = construirOrden(ORDENAMIENTO, { orden, direccion });
        return await this.colectivoRepository.buscarConPaginacion(pagina, limite, {}, sort);
    }

    obtenerActivos = async ({ pagina, limite, orden, direccion } = {}) => {
        const sort = construirOrden(ORDENAMIENTO, { orden, direccion });
        return await this.colectivoRepository.buscarConPaginacion(pagina, limite, { active: true }, sort);
    }

    // idUsuario: usuario de la sesión que crea el colectivo (queda como su cuenta)
    crear = async (datos, idUsuario) => {
        const existente = await this.colectivoRepository.findByNombre(datos.nombre)
        if (existente) {
            throw new ConflictError("Ya existe un colectivo con ese nombre")
        }

        if (await this.colectivoRepository.findByUsuario(idUsuario)) {
            throw new ConflictError(MENSAJE_USUARIO_CON_COLECTIVO)
        }

        const proyectos = await this.proyectoService.obtenerPorListaId(datos.proyectos ?? [])

        try {
            return await this.colectivoRepository.save({
                usuario: idUsuario,
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                ubicacion: datos.ubicacion,
                tipo: datos.tipo,
                proyectos: proyectos.map(p => p._id)
            })
        } catch (error) {
            // El índice único de usuario cubre la carrera entre dos pedidos simultáneos
            if (error.code === 11000 && error.keyPattern?.usuario) throw new ConflictError(MENSAJE_USUARIO_CON_COLECTIVO)
            throw error
        }
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de colectivo inválido")
        }

        const colectivo = await this.colectivoRepository.findById(id)
        if (!colectivo) {
            throw new NotFoundError("Colectivo no encontrado")
        }
        return colectivo
    }

    finalizarTodosLosProyectos = async (colectivo) => {
        const proyectos = colectivo.proyectos || [];

        if (proyectos.length === 0) return 0;

        const paraFinalizar = proyectos.map(proyecto => proyecto.id);

        const finalizados = await this.proyectoService.finalizarVariosProyectos(paraFinalizar);
        return finalizados;
    }

    finalizarProyecto = async (idColectivo, idProyecto) => {
        await this.obtenerPorId(idColectivo)
        return await this.proyectoService.finalizar(idProyecto)
    }

    // usuario: sesión que pide la baja (sin usuario es una llamada interna).
    // Un colectivo solo puede darse de baja a sí mismo; admin, a cualquiera
    desactivarColectivo = async (id, usuario) => {
        const colectivo = await this.obtenerPorId(id);

        if (usuario && usuario.rol !== roles.ADMIN && colectivo.usuario?.toString() !== usuario.id) {
            throw new ForbiddenError("Solo podés dar de baja tu propio colectivo");
        }

        if (!colectivo.active) 
            throw new BadRequestError("El colectivo ya se encuentra desactivado");

        // Si se desactiva el colectivo, se finalizan todos los proyectos asociados
        const finalizados = await this.finalizarTodosLosProyectos(colectivo);

        const desactivado = await this.colectivoRepository.update(id, { active: false });
        return { 
            mensaje: `Colectivo ${desactivado.nombre} desactivado correctamente, ${finalizados} proyectos finalizados.` 
        };
    }

    buscarPorUsuario = async (idUsuario) => {
        return await this.colectivoRepository.findByUsuarioConProyectos(idUsuario);
    }

    actualizarPorUsuario = async (idUsuario, cambios) => {
        const colectivo = await this.colectivoRepository.findByUsuario(idUsuario)
        if (!colectivo) {
            throw new NotFoundError("El usuario no tiene un colectivo asociado")
        }

        if (cambios.nombre !== undefined && cambios.nombre !== colectivo.nombre) {
            const existente = await this.colectivoRepository.findByNombre(cambios.nombre)
            if (existente && existente.id !== colectivo.id) {
                throw new ConflictError("Ya existe un colectivo con ese nombre")
            }
        }

        return await this.colectivoRepository.update(colectivo.id, cambios)
    }

    obtenerEstadisticas = async (idColectivo) => {
        const respuesta = {
            proyectosActivos: 0,
            proyectosTotales: 0,
            colaboracionesActivas: 0,
            colaboracionesTotales: 0,
            postulacionesPendientes: 0
        };

        const proyectos = await this.colectivoRepository.obtenerProyectos(idColectivo);
        if (!proyectos || !proyectos.length) return respuesta;

        respuesta.proyectosTotales = proyectos.length;
        respuesta.proyectosActivos = proyectos.filter(p => !p.finalizado).length;

        const idsProyectos = proyectos.map(p => p._id);
        const [colaboraciones, postulacionesPendientes] = await Promise.all([
            this.colaboracionRepository.buscarPorVariosProyectos(idsProyectos),
            this.postulacionRepository.cantidadPendientesDeVariosProyectos(idsProyectos)
        ]);

        respuesta.colaboracionesTotales = colaboraciones.length;
        respuesta.colaboracionesActivas = colaboraciones.filter(c => c.estaActiva()).length;
        respuesta.postulacionesPendientes = postulacionesPendientes;

        return respuesta;
    }

    obtenerPotencialesColaboradores = async (idColectivo, idsProyectos = [], paginacion = {}) => {
        const proyectosDelColectivo = await this.colectivoRepository.obtenerProyectosConPerfiles(idColectivo);
        if (!proyectosDelColectivo) throw new NotFoundError("Colectivo no encontrado");

        let proyectos = proyectosDelColectivo;
        if (idsProyectos.length > 0) {
            const propios = new Set(proyectosDelColectivo.map(p => p._id.toString()));

            const ajenos = idsProyectos.filter(id => !propios.has(id));
            if (ajenos.length > 0)
                throw new NotFoundError("Proyectos no encontrados en el colectivo", ajenos);
            
            const pedidos = new Set(idsProyectos);
            proyectos = proyectosDelColectivo.filter(p => pedidos.has(p._id.toString()));
        }

        const perfilesAbiertos = proyectos
            .filter(proyecto => !proyecto.finalizado)
            .flatMap(proyecto => (proyecto.perfiles ?? [])
                .filter(perfil => perfil.busquedaAbierta !== false)
                .map(perfil => ({ proyecto, perfil })));

        // Sin perfiles no hay a quién buscar: se devuelve una página vacía
        if (perfilesAbiertos.length === 0) {
            const pagina = paginacion.pagina ?? 1;
            const limite = paginacion.limite ?? 10;
            return { colaboradores: [], total: 0, pagina, limite, totalPaginas: 0 };
        }

        const resultado = await this.colaboradorService.obtenerColaboradoresPotenciales(
            perfilesAbiertos.map(({ perfil }) => perfil),
            paginacion
        );

        return {
            ...resultado,
            colaboradores: resultado.colaboradores.map(colaborador => ({
                colaborador,
                perfilesCompatibles: perfilesQueCumple(colaborador, perfilesAbiertos),
            })),
        };
    }
}

const idsDe = (lista = []) => lista.map(elemento => (elemento?._id ?? elemento).toString());

const perfilesQueCumple = (colaborador, perfilesAbiertos) => {
    const habilidadesDelColaborador = new Set(idsDe(colaborador.habilidades));
    return perfilesAbiertos
        .filter(({ perfil }) => idsDe(perfil.habilidadesRequeridas).every(id => habilidadesDelColaborador.has(id)))
        .map(({ proyecto, perfil }) => ({
            proyecto: { id: proyecto._id.toString(), titulo: proyecto.titulo },
            perfil: { id: perfil._id.toString(), titulo: perfil.titulo },
        }));
};

module.exports = new ColectivoService();
