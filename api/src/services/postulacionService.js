const mongoose = require('mongoose');
const postulacionRepository = require('../repositories/postulacionRepository.js');
const proyectoService = require('./proyectoService.js');
const colaboradorService = require('./colaboradorService.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const colaboracionRepository = require('../repositories/colaboracionRepository.js');
const EstadoPostulacion = require('../models/Proyecto/Postulaciones/EstadoPostulacion.js');
const { BadRequestError, ConflictError, ForbiddenError, NotFoundError } = require('../errors/AppError.js');
const reporteService = require('./reporteService.js');
const { TipoEntidadReportada } = require('../models/Reporte.js');

class PostulacionService {
    constructor() {
        this.postulacionRepository = postulacionRepository;
        this.proyectoService = proyectoService;
        this.colaboradorService = colaboradorService;
        this.colectivoRepository = colectivoRepository;
        this.colaboracionRepository = colaboracionRepository;
        this.reporteService = reporteService;
    }

    crear = async (datos) => {
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

        // 4. Obtener y validar colaborador
        let colaborador;
        if (idColaborador) {
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
        this.reporteService.revisarEnSegundoPlano(TipoEntidadReportada.POSTULACION, nuevaPostulacion);

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

    obtenerTodas = async (filtros = {}) => {
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
            query.proyecto = { $in: idsProyectos };
        }

        return await this.postulacionRepository.findAll(query);
    }

    obtenerPorId = async (id) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de postulación inválido");
        }

        const postulacion = await this.postulacionRepository.findById(id);
        if (!postulacion) {
            throw new NotFoundError("Postulación no encontrada");
        }

        return postulacion;
    }

    // La colaboradora de la sesión solo se postula a nombre propio
    crearComoColaboradora = async (datos, idUsuario) => {
        const colaborador = await this.colaboradorService.buscarPorUsuario(idUsuario);
        if (!colaborador) throw new NotFoundError("El usuario no tiene un perfil de colaboradora");

        const esOtraPersona = (datos.idColaborador && datos.idColaborador !== colaborador.id)
            || (datos.cuentaGit && datos.cuentaGit !== colaborador.cuentaGit);
        if (esOtraPersona) throw new ForbiddenError("Solo podés postularte a nombre propio");

        const { cuentaGit, ...resto } = datos;
        return await this.crear({ ...resto, idColaborador: colaborador.id });
    }

    // Solo el colectivo dueño del proyecto acepta o rechaza sus postulaciones
    actualizarEstadoComoColectivo = async (id, nuevoEstado, idUsuario) => {
        const postulacion = await this.obtenerPorId(id);
        const idProyecto = (postulacion.proyecto?._id ?? postulacion.proyecto?.id ?? postulacion.proyecto).toString();
        await this.proyectoService.obtenerEditablePorColectivo(idProyecto, idUsuario);

        return await this.actualizarEstado(id, nuevoEstado);
    }

    actualizarEstado = async (id, nuevoEstado) => {
        const postulacion = await this.obtenerPorId(id);

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

        const idColaborador = postulacion.colaborador.id ?? postulacion.colaborador;
        const colaborador = await this.colaboradorService.obtenerPorId(idColaborador);

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

        // Crear la colaboración con datos desnormalizados
        await this.colaboracionRepository.save({
            colaborador: {
                id: colaborador.id ?? colaborador._id,
                nombre: colaborador.nombre,
                apellido: colaborador.apellido,
                usuario: colaborador.usuario
            },
            proyecto: {
                id: proyecto.id ?? proyecto._id,
                titulo: proyecto.titulo,
                descripcion: proyecto.descripcion
            },
            perfil: perfil._id,
            inicio: new Date()
        });

        // Actualizar el estado de la postulación
        return await this.postulacionRepository.updateEstado(postulacion.id, EstadoPostulacion.ACEPTADA);
    }
}

module.exports = new PostulacionService();
