class NotificacionPublic {
    constructor(id, proyecto, perfil, mensaje, fecha) {
        this.id = id
        this.proyecto = { id: proyecto.id, titulo: proyecto.titulo }
        this.perfil = { id: perfil.id, descripcion: perfil.descripcion }
        this.mensaje = mensaje
        this.fecha = fecha
    }

    static desde(notificacion) {
        return new NotificacionPublic(
            notificacion.id,
            notificacion.proyecto,
            notificacion.perfil,
            notificacion.mensaje,
            notificacion.fecha
        )
    }
}

module.exports = { NotificacionPublic }
