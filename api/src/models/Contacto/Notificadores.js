const MedioDeContacto = require('./MedioDeContacto');

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

module.exports = { NotificadorEmail, NotificadorWhatsapp, NotificadorSms, obtenerNotificador };
