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

module.exports = Notificacion;