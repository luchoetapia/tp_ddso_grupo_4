class PalabraBaneadaPublic {
    constructor(id, palabra, activa, fechaCreacion) {
        this.id = id
        this.palabra = palabra
        this.activa = activa
        this.fechaCreacion = fechaCreacion
    }

    static desde(palabra) {
        return new PalabraBaneadaPublic(palabra.id, palabra.palabra, palabra.activa, palabra.createdAt)
    }
}

module.exports = { PalabraBaneadaPublic }
