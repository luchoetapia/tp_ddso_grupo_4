class LogroPublic {
    constructor(id, titulo, descripcion) {
        this.id = id
        this.titulo = titulo
        this.descripcion = descripcion
    }

    static desde(logro) {
        return new LogroPublic(logro.id, logro.titulo, logro.descripcion)
    }
}

module.exports = { LogroPublic }
