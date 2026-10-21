class Habilidad {
    constructor(id, titulo, tipoHabilidad, descripcion) {
        this.id = id
        this.titulo = titulo
        this.tipoHabilidad = tipoHabilidad
        this.descripcion = descripcion
    }
}

const TipoHabilidad = {
    PROGRAMACION: 'programacion',
    DISEÑO: 'diseño',
    MARKETING: 'marketing',
    COMUNICACION: 'comunicacion',
    GESTION_PROYECTOS: 'gestion_proyectos',
    COLABORACION: 'colaboracion',
}

module.exports = { Habilidad, TipoHabilidad }