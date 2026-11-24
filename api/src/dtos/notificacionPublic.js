class NotificacionPublic {
    constructor(id, mensaje, fecha, automatica) {
        this.id = id
        this.mensaje = mensaje
        this.fecha = fecha
        this.automatica = automatica
    }

    static desde(notificacion) {
        return new NotificacionPublic(
            notificacion.id,
            notificacion.mensaje,
            notificacion.fecha,
            notificacion.automatica ?? false
        )
    }
}

module.exports = { NotificacionPublic }
