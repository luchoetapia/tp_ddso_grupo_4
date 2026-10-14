const notificacionRepository = require('../repositories/notificacionRepository.js');
const colaboradorRepository = require('../repositories/colaboradorRepository.js');
const proyectoService = require('./proyectoService.js');
const { obtenerNotificador } = require('../models/Contacto/Notificadores.js');
const { ConflictError, NotFoundError } = require('../errors/AppError.js');
const colaboradorService = require('./colaboradorService.js');

class NotificacionService {
    constructor() {
        this.notificacionRepository = notificacionRepository;
        this.colaboradorRepository = colaboradorRepository;
        this.proyectoService = proyectoService;
        this.obtenerNotificador = obtenerNotificador;
        this.colaboradorService = colaboradorService;
    }

    toDTO = (notificacion) => {
        return {
            id: notificacion.id || notificacion._id?.toString(),
            destinatario: (notificacion.destinatario?._id ?? notificacion.destinatario)?.toString(),
            proyecto: notificacion.proyecto?.titulo
                ? { id: notificacion.proyecto._id.toString(), titulo: notificacion.proyecto.titulo }
                : notificacion.proyecto,
            perfil: notificacion.perfil?.descripcion
                ? { id: notificacion.perfil._id.toString(), descripcion: notificacion.perfil.descripcion }
                : notificacion.perfil,
            mensaje: notificacion.mensaje,
            fecha: notificacion.fecha
        };
    }

    obtenerColaborador = async (cuentaGit) => {
        return await this.colaboradorService.obtenerPorCuentaGit(cuentaGit);
    }

    contactarColaborador = async (idProyecto, idPerfil, cuentaGit, mensaje) => {
        const proyecto = await this.proyectoService.obtenerPorId(idProyecto);
        if (proyecto.finalizado) {
            throw new ConflictError("El proyecto está finalizado");
        }

        const perfil = this.proyectoService.perfilPerteneceAProyecto(idProyecto, idPerfil);

        const colaborador = await this.obtenerColaborador(cuentaGit);
        if (!colaborador.deseaSerContactado) {
            throw new ConflictError("El colaborador no acepta ser contactado");
        }

        const notificacion = await this.notificacionRepository.save({
            destinatario: colaborador._id,
            proyecto: proyecto.id,
            perfil: idPerfil,
            mensaje
        });

        this.replicarPorMediosDeContacto(colaborador.contactos, notificacion);

        return this.toDTO(notificacion);
    }

    replicarPorMediosDeContacto = (contactos = [], notificacion) => {
        for (const contacto of contactos) {
            const notificador = this.obtenerNotificador(contacto.medio);
            if (notificador) {
                notificador.enviar(contacto, notificacion);
            }
        }
    }

    obtenerPorColaborador = async (cuentaGit) => {
        const colaborador = await this.obtenerColaborador(cuentaGit);
        const notificaciones = await this.notificacionRepository.findByDestinatario(colaborador._id);
        return notificaciones.map(this.toDTO);
    }
}

module.exports = new NotificacionService();
