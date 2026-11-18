const mongoose = require('mongoose');
const postulacionRepository = require('../repositories/postulacionRepository.js');
const proyectoService = require('./proyectoService.js');
const colaboradorService = require('./colaboradorService.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const colaboracionRepository = require('../repositories/colaboracionRepository.js');
const EstadoPostulacion = require('../models/Proyecto/Postulaciones/EstadoPostulacion.js');
const { BadRequestError, ConflictError, ForbiddenError, NotFoundError } = require('../errors/AppError.js');
const { roles } = require('../auth/models/usuario.js');

const idDe = (ref) => (ref?._id ?? ref)?.toString();

class PostulacionService {
    constructor() {
        this.postulacionRepository = postulacionRepository;
        this.proyectoService = proyectoService;
        this.colaboradorService = colaboradorService;
        this.colectivoRepository = colectivoRepository;
        this.colaboracionRepository = colaboracionRepository;
    }

    // ---------- Control de acceso ----------
    // "usuario" es la sesión (req.usuario). Sin usuario es una llamada interna y no se restringe.

    colaboradoraDeLaSesion = async (usuario) => {
        const colaborador = await this.colaboradorService.buscarPorUsuario(usuario.id);
        if (!colaborador) throw new NotFoundError("El usuario no tiene un perfil de colaboradora");
        return colaborador;
    }

    colectivoDeLaSesion = async (usuario) => {
        const colectivo = await this.colectivoRepository.findByUsuario(usuario.id);
        if (!colectivo) throw new NotFoundError("El usuario no tiene un colectivo asociado");
        return colectivo;
    }

    // Una postulación la ven la colaboradora que se postuló y el colectivo dueño del proyecto
    verificarAcceso = async (postulacion, usuario) => {
        if (!usuario || usuario.rol === roles.ADMIN) return;

        if (usuario.rol === roles.COLABORADOR) {
            const colaborador = await this.colaboradoraDeLaSesion(usuario);
            if (idDe(postulacion.colaborador) === colaborador.id) return;
        }

        if (usuario.rol === roles.COLECTIVO) {
            const colectivo = await this.colectivoDeLaSesion(usuario);
            if (colectivo.proyectos.some(p => idDe(p) === idDe(postulacion.proyecto))) return;
        }

        throw new ForbiddenError("No tenés acceso a esta postulación");
    }

    // Acota los filtros a lo que la sesión puede ver: la colaboradora, sus postulaciones; el colectivo, las de sus proyectos
    acotarFiltros = async (filtros, usuario) => {
        if (!usuario || usuario.rol === roles.ADMIN) return filtros;

        if (usuario.rol === roles.COLABORADOR) {
            const colaborador = await this.colaboradoraDeLaSesion(usuario);
            if (filtros.idColaborador && filtros.idColaborador !== colaborador.id) {
                throw new ForbiddenError("Solo podés ver tus propias postulaciones");
            }
            return { ...filtros, idColaborador: colaborador.id };
        }

        if (usuario.rol === roles.COLECTIVO) {
            const colectivo = await this.colectivoDeLaSesion(usuario);
            if (filtros.idColectivo && filtros.idColectivo !== colectivo.id) {
                throw new ForbiddenError("Solo podés ver las postulaciones de tu colectivo");
            }
            if (filtros.idProyecto && !colectivo.proyectos.some(p => idDe(p) === filtros.idProyecto)) {
                throw new ForbiddenError("El proyecto no pertenece a tu colectivo");
            }
            return { ...filtros, idColectivo: colectivo.id };
        }

        throw new ForbiddenError("No tenés acceso a las postulaciones");
    }

    crear = async (datos, usuario) => {
        const { idProyecto, idPerfil, idColaborador, cuentaGit, mensaje } = datos;

        // 1. Obtener y validar proyecto
        const proyecto = await this.proyectoService.obtenerPorId(idProyecto);
        if (proyecto.finalizado) {
            throw new ConflictError("El proyecto ya fue finalizado y no admite nuevas postulaciones");
        }

        // 2. Obtener y validar perfil
        const perfil = proyecto.perfiles.id(idPerfil);
        if (!perfil) {
            throw new NotFoundError("El perfil no pertenece al proyecto especificado");
        }

        // 3. Validar búsqueda abierta y vigencia
        if (!perfil.busquedaAbierta) {
            throw new ConflictError("La búsqueda para este perfil no está abierta");
        }

        if (perfil.fechaFinBusqueda && new Date(perfil.fechaFinBusqueda) < new Date()) {
            throw new ConflictError("La fecha límite para postularse a este perfil ya ha expirado");
        }

        // 4. Obtener y validar colaborador. Con sesión, es la colaboradora logueada: nadie puede postular a otra persona
        let colaborador;
        if (usuario) {
            colaborador = await this.colaboradoraDeLaSesion(usuario);
            if ((idColaborador && idColaborador !== colaborador.id) || (cuentaGit && cuentaGit !== colaborador.cuentaGit)) {
                throw new ForbiddenError("Solo podés postularte vos misma");
            }
        } else if (idColaborador) {
            colaborador = await this.colaboradorService.obtenerPorId(idColaborador);
        } else {
            colaborador = await this.colaboradorService.obtenerPorCuentaGit(cuentaGit);
        }

        // 5. Validar que cumpla con las habilidades requeridas del perfil
        const idsHabilidadesColaborador = colaborador.habilidades.map(h => (h._id ?? h).toString());
        if (!perfil.cumpleHabilidadesRequeridas(idsHabilidadesColaborador)) {
            throw new ConflictError("La persona colaboradora no cumple con las habilidades requeridas del perfil");
        }

        // 6. Validar que no tenga una postulación previa pendiente o aceptada
        const postulacionActiva = await this.postulacionRepository.findActiva(colaborador.id, proyecto.id, perfil._id);
        if (postulacionActiva) {
            throw new ConflictError("La persona colaboradora ya tiene una postulación pendiente o aceptada para este perfil");
        }

        // 7. Guardar postulación
        let nuevaPostulacion = await this.postulacionRepository.save({
            colaborador: colaborador.id,
            proyecto: proyecto.id,
            perfil: perfil._id,
            mensaje: mensaje ?? "",
            estado: EstadoPostulacion.PENDIENTE,
            fecha: new Date()
        });

        // 8. Evaluar postulación según la estrategia de aceptación del proyecto
        if (proyecto.estrategiaAceptacion) {
            const { obtenerEstrategia } = require('../models/Proyecto/EsrtategiaAceptacion/index.js');
            const estrategia = obtenerEstrategia(proyecto.estrategiaAceptacion, proyecto);

            if (!proyecto.postulaciones) {
                const postulacionesPrevias = await this.postulacionRepository.findAll({ proyecto: proyecto.id });
                proyecto.postulaciones = postulacionesPrevias || [];
            }
            if (!proyecto.postulaciones.some(p => (p.id ?? p._id) === (nuevaPostulacion.id ?? nuevaPostulacion._id))) {
                proyecto.postulaciones.push(nuevaPostulacion);
            }

            estrategia.evaluarPostulacion(nuevaPostulacion);

            if (nuevaPostulacion.estado === EstadoPostulacion.ACEPTADA) {
                nuevaPostulacion = await this.procesarAceptacion(nuevaPostulacion);
            } else if (nuevaPostulacion.estado === EstadoPostulacion.RECHAZADA) {
                nuevaPostulacion = await this.postulacionRepository.updateEstado(nuevaPostulacion.id, EstadoPostulacion.RECHAZADA);
            }

            // Procesar posibles aceptaciones en lote (ej. HastaLlenarVacantes)
            for (const post of (proyecto.postulaciones || [])) {
                const pId = (post.id ?? post._id)?.toString();
                const nuevoId = (nuevaPostulacion.id ?? nuevaPostulacion._id)?.toString();
                if (pId !== nuevoId && post.estado === EstadoPostulacion.ACEPTADA) {
                    await this.procesarAceptacion(post);
                }
            }

            if (perfil.busquedaAbierta === false) {
                await this.proyectoService.modificarPerfil(proyecto.id, perfil._id, { busquedaAbierta: false });
            }
        }

        return nuevaPostulacion;
    }

    obtenerTodas = async (filtrosPedidos = {}, usuario) => {
        const filtros = await this.acotarFiltros(filtrosPedidos, usuario);
        const query = {};

        if (filtros.idProyecto) {
            query.proyecto = filtros.idProyecto;
        }

        if (filtros.idPerfil) {
            query.perfil = filtros.idPerfil;
        }

        if (filtros.idColaborador) {
            query.colaborador = filtros.idColaborador;
        }

        if (filtros.estado) {
            query.estado = filtros.estado;
        }

        if (filtros.idColectivo) {
            const colectivo = await this.colectivoRepository.findById(filtros.idColectivo);
            if (!colectivo) {
                throw new NotFoundError("Colectivo no encontrado");
            }
            const idsProyectos = colectivo.proyectos.map(p => (p._id ?? p).toString());
            // Si además se filtró por un proyecto (ya validado como propio), se respeta ese filtro
            if (!query.proyecto) query.proyecto = { $in: idsProyectos };
        }

        return await this.postulacionRepository.findAll(query);
    }

    obtenerPorId = async (id, usuario) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de postulación inválido");
        }

        const postulacion = await this.postulacionRepository.findById(id);
        if (!postulacion) {
            throw new NotFoundError("Postulación no encontrada");
        }

        await this.verificarAcceso(postulacion, usuario);
        return postulacion;
    }

    actualizarEstado = async (id, nuevoEstado, usuario) => {
        const postulacion = await this.obtenerPorId(id);

        // Solo el colectivo dueño acepta o rechaza, y mientras el proyecto siga en curso
        if (usuario) {
            await this.proyectoService.obtenerEditablePorColectivo(idDe(postulacion.proyecto), usuario.id);
        }

        if (postulacion.estado !== EstadoPostulacion.PENDIENTE) {
            throw new ConflictError(`La postulación ya se encuentra en estado '${postulacion.estado}' y no puede ser modificada`);
        }

        if (nuevoEstado === EstadoPostulacion.ACEPTADA) {
            return await this.procesarAceptacion(postulacion);
        }

        if (nuevoEstado === EstadoPostulacion.RECHAZADA) {
            return await this.postulacionRepository.updateEstado(postulacion.id, EstadoPostulacion.RECHAZADA);
        }

        throw new BadRequestError(`Estado no soportado: ${nuevoEstado}`);
    }

    procesarAceptacion = async (postulacion) => {
        const proyecto = await this.proyectoService.obtenerPorId(postulacion.proyecto.id ?? postulacion.proyecto);
        const perfil = proyecto.perfiles.id(postulacion.perfil);
        if (!perfil) {
            throw new NotFoundError("El perfil asociado a la postulación no existe en el proyecto");
        }

        // Verificar límite de colaboraciones para el perfil
        if (perfil.limiteColaboraciones != null) {
            const activas = await this.colaboracionRepository.contarActivasPorPerfil(proyecto.id, perfil._id);
            if (activas >= perfil.limiteColaboraciones) {
                throw new ConflictError("Se ha alcanzado el límite de colaboraciones para este perfil");
            }

            // Si con esta aceptación se alcanza el cupo, cerrar la búsqueda del perfil
            if (activas + 1 >= perfil.limiteColaboraciones) {
                await this.proyectoService.modificarPerfil(proyecto.id, perfil._id, { busquedaAbierta: false });
            }
        }

        // Crear la colaboración
        await this.colaboracionRepository.save({
            colaborador: postulacion.colaborador.id ?? postulacion.colaborador,
            proyecto: proyecto.id,
            perfil: perfil._id,
            inicio: new Date()
        });

        // Actualizar el estado de la postulación
        return await this.postulacionRepository.updateEstado(postulacion.id, EstadoPostulacion.ACEPTADA);
    }
}

module.exports = new PostulacionService();
