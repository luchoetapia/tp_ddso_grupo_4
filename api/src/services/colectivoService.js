const mongoose = require('mongoose');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');
const proyectoService = require('./proyectoService.js');

const MENSAJE_USUARIO_CON_COLECTIVO = "El usuario ya tiene un colectivo asociado";

class ColectivoService {
    constructor() {
        this.colectivoRepository = colectivoRepository;
        this.proyectoService = proyectoService;
    }

    obtenerTodos = async () => {
        const colectivos = await this.colectivoRepository.findAll();
        return colectivos;
    }

    obtenerActivos = async () => {
        const colectivos = await this.colectivoRepository.findBy({ active: true });
        return colectivos;
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

    desactivarColectivo = async (id) => {
        const colectivo = await this.obtenerPorId(id);

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
        return await this.colectivoRepository.findByUsuario(idUsuario);
    }
}

module.exports = new ColectivoService();
