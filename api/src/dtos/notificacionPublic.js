class NotificacionPublic {
    constructor(id, mensaje, fecha) {
        this.id = id
        this.mensaje = mensaje
        this.fecha = fecha
    }

    static desde(notificacion) {
        return new NotificacionPublic(
            notificacion.id,
            notificacion.mensaje,
            notificacion.fecha
        )
    }
}

module.exports = { NotificacionPublic }
