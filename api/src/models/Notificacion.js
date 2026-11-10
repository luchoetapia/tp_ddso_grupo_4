const { MedioDeContacto } = require('./Contacto');

class Notificacion {
    constructor(id, destinatario, proyecto, perfil, mensaje, fecha = new Date()) {
        this.id = id,
        this.destinatario = destinatario,
        this.proyecto = proyecto,
        this.perfil = perfil,
        this.mensaje = mensaje,
        this.fecha = fecha
    }

    generarTexto() {
        const titulo = this.proyecto?.titulo ?? 'un proyecto';
        const perfil = this.perfil?.descripcion ?? 'un perfil';
        return `El proyecto "${titulo}" te contactó por el perfil "${perfil}": ${this.mensaje}`;
    }
}

class NotificadorEmail {
    enviar(contacto, notificacion) {
        console.log(`[Email a ${contacto.valor}] ${notificacion.generarTexto()}`);
    }
}

class NotificadorWhatsapp {
    enviar(contacto, notificacion) {
        console.log(`[WhatsApp a ${contacto.valor}] ${notificacion.generarTexto()}`);
    }
}

class NotificadorSms {
    enviar(contacto, notificacion) {
        console.log(`[SMS a ${contacto.valor}] ${notificacion.generarTexto()}`);
    }
}

const notificadores = {
    [MedioDeContacto.EMAIL]: new NotificadorEmail(),
    [MedioDeContacto.WHATSAPP]: new NotificadorWhatsapp(),
    [MedioDeContacto.SMS]: new NotificadorSms()
}

const obtenerNotificador = (medio) => notificadores[medio];

module.exports = { Notificacion, obtenerNotificador, NotificadorEmail, NotificadorWhatsapp, NotificadorSms };