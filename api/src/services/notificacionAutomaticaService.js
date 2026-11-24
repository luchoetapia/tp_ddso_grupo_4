const colaboradorRepository = require('../repositories/colaboradorRepository.js');
const proyectoRepository = require('../repositories/proyectoRepository.js');
const notificacionRepository = require('../repositories/notificacionRepository.js');
const { obtenerNotificador } = require('../models/Notificacion.js');

const MENSAJE_AUTOMATICO = 'Tus habilidades cubren lo que pide este perfil.';

const idDe = (habilidad) => (habilidad._id ?? habilidad).toString();

class NotificacionAutomaticaService {
    constructor() {
        this.colaboradorRepository = colaboradorRepository;
        this.proyectoRepository = proyectoRepository;
        this.notificacionRepository = notificacionRepository;
        this.obtenerNotificador = obtenerNotificador;
    }

    //cuando se crea un proyecto o se agrega un perfil
    notificarColaboradoresCompatibles = async (proyecto, perfiles = proyecto.perfiles) => {
        if (proyecto.finalizado) return 0;

        let enviadas = 0;
        for (const perfil of perfiles.filter(p => p.estaAbierto())) {
            const requeridas = perfil.habilidadesRequeridas.map(idDe);
            const candidatas = await this.colaboradorRepository.findByCondition({
                deseaSerContactado: true,
                ...(requeridas.length > 0 && { habilidades: { $all: requeridas } })
            });

            for (const colaborador of candidatas) {
                if (await this.notificar(colaborador, `Encontramos un proyecto para vos: "${proyecto.titulo}", perfil "${perfil.titulo}."`)) enviadas++;
            }
        }

        return enviadas;
    }

    //cuando se crea una colaboradora le manda perfiles que le sirvan
    notificarProyectosCompatibles = async (colaborador) => {
        if (!colaborador.deseaSerContactado) return 0;

        const idsHabilidades = colaborador.habilidades.map(idDe);
        const proyectos = await this.proyectoRepository.findAbiertosCumplibles(idsHabilidades);

        let enviadas = 0;
        for (const proyecto of proyectos) {
            const perfiles = proyecto.perfiles.filter(p => p.estaAbierto() && p.cumpleHabilidadesRequeridas(idsHabilidades));
            for (const perfil of perfiles) {
                if (await this.notificar(colaborador, `El proyecto "${proyecto.titulo}" te contactó por el perfil "${perfil.titulo}"`)) enviadas++;
            }
        }
        return enviadas;
    }

    notificar = async (destinatario, mensaje) => {
        if (destinatario.usuario?.activo === false) return false;
        try {
            const notificacion = await this.notificacionRepository.save({
                destinatario: destinatario.usuario,
                mensaje: mensaje,
                automatica: true
            });

            if(destinatario.contactos != null) {
                this.replicarPorMediosDeContacto(destinatario.contactos, notificacion);
            }

            return true;
        } catch (error) {
            console.error(`Notificación automática fallida (Destinatario ID:  ${destinatario.id}`, error);
            return false;
        }
    }

    replicarPorMediosDeContacto = (contactos = [], notificacion) => {
        for (const contacto of contactos) {
            this.obtenerNotificador(contacto.medio)?.enviar(contacto, notificacion);
        }
    }

    notificarColaboradoresCompatiblesEnSegundoPlano = (proyecto, perfiles) => {
        this.notificarColaboradoresCompatibles(proyecto, perfiles)
            .catch(error => console.error(`Notificación automática fallida (proyecto ${proyecto?.id}):`, error));
    }

    notificarProyectosCompatiblesEnSegundoPlano = (colaborador) => {
        this.notificarProyectosCompatibles(colaborador)
            .catch(error => console.error(`Notificación automática fallida (colaboradora ${colaborador?.id}):`, error));
    }

}

module.exports = new NotificacionAutomaticaService();