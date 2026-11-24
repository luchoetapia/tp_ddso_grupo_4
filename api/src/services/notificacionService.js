const notificacionRepository = require('../repositories/notificacionRepository.js');
const proyectoService = require('./proyectoService.js');
const { obtenerNotificador } = require('../models/Notificacion.js');
const { ConflictError, NotFoundError } = require('../errors/AppError.js');
const colaboradorService = require('./colaboradorService.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const { roles } = require('../auth/models/usuario.js');

class NotificacionService {
    constructor() {
        this.notificacionRepository = notificacionRepository;
        this.proyectoService = proyectoService;
        this.obtenerNotificador = obtenerNotificador;
        this.colaboradorService = colaboradorService;
        this.colectivoRepository = colectivoRepository;
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
        if (colaborador.usuario?.activo === false) {
            throw new ConflictError('No se puede contactar a una cuenta inactiva');
        }
        
        if (!colaborador.deseaSerContactado) {
            throw new ConflictError("El colaborador no acepta ser contactado");
        }

        const notificacion = await this.notificacionRepository.save({
            destinatario: colaborador.usuario,
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

    // Mensajes del usuario de la sesión (cualquier rol). Las notificaciones se guardan con el id del usuario.
    // Los avisos a un colectivo se dirigen a su cuenta titular: los administradores adicionales también los ven.
    obtenerPropias = async ({ id, rol }) => {
        const destinatarios = [id];

        if (rol === roles.COLECTIVO) {
            const colectivo = await this.colectivoRepository.findByUsuario(id);
            const titular = colectivo?.usuario?.toString();
            if (titular && titular !== id.toString()) destinatarios.push(titular);
        }

        return await this.notificacionRepository.findByDestinatario(destinatarios);
    }
}


module.exports = new NotificacionService();
