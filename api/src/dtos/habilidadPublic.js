class HabilidadPublic {
    constructor(id, titulo, tipoHabilidad, descripcion) {
        this.id = id
        this.titulo = titulo
        this.tipoHabilidad = tipoHabilidad
        this.descripcion = descripcion
    }

    static desde(habilidad) {
        return new HabilidadPublic(habilidad.id, habilidad.titulo, habilidad.tipoHabilidad, habilidad.descripcion)
    }
}

// Vista reducida para cuando la habilidad aparece dentro de otro recurso (colaborador, perfil)
class HabilidadResumen {
    constructor(id, titulo) {
        this.id = id
        this.titulo = titulo
    }

    static desde(habilidad) {
        return new HabilidadResumen(habilidad.id, habilidad.titulo)
    }

    static desdeLista(habilidades = []) {
        return habilidades.map(HabilidadResumen.desde)
    }
}

module.exports = { HabilidadPublic, HabilidadResumen }
