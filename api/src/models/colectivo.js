class Colectivo {
    constructor(id, usuario, nombre, descripcion, ubicacion, tipo, proyectos) {
        this.id = id
        this.usuario = usuario
        this.nombre = nombre
        this.descripcion = descripcion
        this.ubicacion = ubicacion
        this.tipo = tipo
        this.proyectos = proyectos
    }
}

const TipoColectivo = {
    FUNDACION: 'fundacion',
    ASOCIACION_BARRIAL: 'asociacion_barrial',
    ONG: 'ong',
    ASAMBLEA: 'asamblea',
}

module.exports = {Colectivo, TipoColectivo}