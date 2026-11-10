const notificacionRepository = require('../repositories/notificacionRepository.js');
const proyectoService = require('./proyectoService.js');
const { obtenerNotificador } = require('../models/Notificacion.js');
const { ConflictError } = require('../errors/AppError.js');
const colaboradorService = require('./colaboradorService.js');

class NotificacionService {
    constructor() {
        this.notificacionRepository = notificacionRepository;
        this.proyectoService = proyectoService;
        this.obtenerNotificador = obtenerNotificador;
        this.colaboradorService = colaboradorService;
    }

    obtenerColaborador = async (cuentaGit) => {
        return await this.colaboradorService.obtenerPorCuentaGit(cuentaGit);
    }

    contactarColaborador = async (idProyecto, idPerfil, cuentaGit, mensaje) => {
        const proyecto = await this.proyectoService.obtenerPorId(idProyecto);
        if (proyecto.finalizado) {
            throw new ConflictError("El proyecto está finalizado");
        }

        const perfil = await this.proyectoService.perfilPerteneceAProyecto(idProyecto, idPerfil);

        const colaborador = await this.obtenerColaborador(cuentaGit);
        if (!colaborador.deseaSerContactado) {
            throw new ConflictError("El colaborador no acepta ser contactado");
        }

        const notificacion = await this.notificacionRepository.save({
            destinatario: colaborador.id,
            proyecto: { id: proyecto.id, titulo: proyecto.titulo },
            perfil: { id: perfil.id, descripcion: perfil.descripcion },
            mensaje
        });

        const contactos = await this.colaboradorService.obtenerContactos(cuentaGit);
        this.replicarPorMediosDeContacto(contactos, notificacion);

        return notificacion;
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
        const notificaciones = await this.notificacionRepository.findByDestinatario(colaborador.id);
        return notificaciones;
    }
}

module.exports = new NotificacionService();
