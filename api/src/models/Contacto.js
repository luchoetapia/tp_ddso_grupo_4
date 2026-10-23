class Contacto {
    constructor(id, medio, valor) {
        this.id = id,
        this.medio = medio,
        this.valor = valor
    }
}

const MedioDeContacto = {
    EMAIL: "Email",
    WHATSAPP: "WhatsApp",
    SMS: "SMS"
}

module.exports = { Contacto, MedioDeContacto };