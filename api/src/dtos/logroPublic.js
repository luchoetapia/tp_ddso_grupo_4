class LogroPublic {
    constructor(id, titulo, descripcion, fecha) {
        this.id = id
        this.titulo = titulo
        this.descripcion = descripcion
        this.fecha = fecha
    }

    static desde(logro) {
        return new LogroPublic(logro.id, logro.titulo, logro.descripcion, logro.createdAt)
    }
}

module.exports = { LogroPublic }
