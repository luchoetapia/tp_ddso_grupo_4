const { MedioDeContacto } = require('./Contacto');

class Notificacion {
    constructor(id, destinatario, mensaje, fecha = new Date(), automatica = false) {
        this.id = id,
        this.destinatario = destinatario,
        this.mensaje = mensaje,
        this.fecha = fecha,
        this.automatica = automatica
    }

    // generarTexto() {
    //     const titulo = this.proyecto?.titulo ?? 'un proyecto';
    //     const perfil = this.perfil?.descripcion ?? 'un perfil';
    //     if (this.automatica) {
    //         return `Encontramos un proyecto para vos: "${titulo}", perfil "${perfil}". ${this.mensaje}`;
    //     }
    //     return `El proyecto "${titulo}" te contactó por el perfil "${perfil}": ${this.mensaje}`;
    // }
}

class NotificadorEmail {
    enviar(contacto, notificacion) {
        console.log(`[Email a ${contacto.valor}] ${notificacion.mensaje}`);
    }
}

class NotificadorWhatsapp {
    enviar(contacto, notificacion) {
        console.log(`[WhatsApp a ${contacto.valor}] ${notificacion.mensaje}`);
    }
}

class NotificadorSms {
    enviar(contacto, notificacion) {
        console.log(`[SMS a ${contacto.valor}] ${notificacion.mensaje}`);
    }
}

const notificadores = {
    [MedioDeContacto.EMAIL]: new NotificadorEmail(),
    [MedioDeContacto.WHATSAPP]: new NotificadorWhatsapp(),
    [MedioDeContacto.SMS]: new NotificadorSms()
}

const obtenerNotificador = (medio) => notificadores[medio];

module.exports = { Notificacion, obtenerNotificador, NotificadorEmail, NotificadorWhatsapp, NotificadorSms };