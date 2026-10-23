const { PerfilPublic, PerfilResumen } = require('./perfilPublic.js');
const { LogroPublic } = require('./logroPublic.js');

// Vista para listados y búsquedas
class ProyectoPublic {
    constructor(id, titulo, descripcion, finalizado, porcentajeFinalizado, perfiles = []) {
        this.id = id
        this.titulo = titulo
        this.descripcion = descripcion
        this.finalizado = finalizado
        this.porcentajeFinalizado = porcentajeFinalizado
        this.perfiles = perfiles.map(PerfilResumen.desde)
    }

    static desde(proyecto) {
        return new ProyectoPublic(
            proyecto.id,
            proyecto.titulo,
            proyecto.descripcion,
            proyecto.finalizado,
            proyecto.porcentajeFinalizado,
            proyecto.perfiles
        )
    }
}

// Vista completa para cuando se consulta un único proyecto
class ProyectoDetalle {
    constructor(id, titulo, descripcion, finalizado, porcentajeFinalizado, enlaceSistema, enlaceCodigoFuente, perfiles = [], logros = []) {
        this.id = id
        this.titulo = titulo
        this.descripcion = descripcion
        this.finalizado = finalizado
        this.porcentajeFinalizado = porcentajeFinalizado
        this.enlaceSistema = enlaceSistema
        this.enlaceCodigoFuente = enlaceCodigoFuente
        this.perfiles = perfiles.map(PerfilPublic.desde)
        this.logros = logros.map(LogroPublic.desde)
    }

    static desde(proyecto) {
        return new ProyectoDetalle(
            proyecto.id,
            proyecto.titulo,
            proyecto.descripcion,
            proyecto.finalizado,
            proyecto.porcentajeFinalizado,
            proyecto.enlaceSistema,
            proyecto.enlaceCodigoFuente,
            proyecto.perfiles,
            proyecto.logros
        )
    }
}

module.exports = { ProyectoPublic, ProyectoDetalle }
