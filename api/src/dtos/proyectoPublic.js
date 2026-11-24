const { PerfilPublic, PerfilResumen } = require('./perfilPublic.js');
const { LogroPublic } = require('./logroPublic.js');

// Vista para listados y búsquedas
class ProyectoPublic {
    constructor(id, titulo, descripcion, finalizado, porcentajeFinalizado, perfiles = [], requiereRevisionManual = false) {
        this.id = id
        this.titulo = titulo
        this.descripcion = descripcion
        this.finalizado = finalizado
        this.porcentajeFinalizado = porcentajeFinalizado
        this.perfiles = perfiles.map(PerfilResumen.desde)
        // Marcado por el cron diario por no tener actualizaciones recientes
        this.requiereRevisionManual = requiereRevisionManual
    }

    static desde(proyecto) {
        return new ProyectoPublic(
            proyecto.id,
            proyecto.titulo,
            proyecto.descripcion,
            proyecto.finalizado,
            proyecto.porcentajeFinalizado,
            proyecto.perfiles,
            proyecto.requiereRevisionManual ?? false
        )
    }
}

// Vista completa para cuando se consulta un único proyecto.
// colectivo: { id, nombre } del colectivo al que pertenece, o null
class ProyectoDetalle {
    constructor(id, titulo, descripcion, finalizado, porcentajeFinalizado, enlaceSistema, enlaceCodigoFuente, perfiles = [], logros = [], estrategiaAceptacion, colectivo = null, revision = {}) {
        this.id = id
        this.titulo = titulo
        this.descripcion = descripcion
        this.finalizado = finalizado
        this.porcentajeFinalizado = porcentajeFinalizado
        this.enlaceSistema = enlaceSistema
        this.enlaceCodigoFuente = enlaceCodigoFuente
        this.perfiles = perfiles.map(PerfilPublic.desde)
        this.logros = logros.map(LogroPublic.desde)
        this.estrategiaAceptacion = estrategiaAceptacion
        this.colectivo = colectivo
        // Marca del cron diario de proyectos sin actualizaciones (motivo y fecha en que se marcó)
        this.requiereRevisionManual = revision.requiereRevisionManual ?? false
        this.revisionManualMotivo = revision.revisionManualMotivo ?? null
        this.revisionManualFecha = revision.revisionManualFecha ?? null
    }

    static desde(proyecto, colectivo = null) {
        return new ProyectoDetalle(
            proyecto.id,
            proyecto.titulo,
            proyecto.descripcion,
            proyecto.finalizado,
            proyecto.porcentajeFinalizado,
            proyecto.enlaceSistema,
            proyecto.enlaceCodigoFuente,
            proyecto.perfiles,
            proyecto.logros,
            proyecto.estrategiaAceptacion,
            colectivo ? { id: String(colectivo._id ?? colectivo.id), nombre: colectivo.nombre } : null,
            {
                requiereRevisionManual: proyecto.requiereRevisionManual,
                revisionManualMotivo: proyecto.revisionManualMotivo,
                revisionManualFecha: proyecto.revisionManualFecha,
            }
        )
    }
}

module.exports = { ProyectoPublic, ProyectoDetalle }
