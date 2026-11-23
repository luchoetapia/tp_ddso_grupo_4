const usuarioResumen = (usuario, conEmail = false) => {
    if (!usuario) return null
    const resumen = { id: usuario.id, username: usuario.username }
    if (conEmail) resumen.email = usuario.email
    return resumen
}

class ReportePublic {
    constructor(reporte) {
        this.id = reporte.id
        this.entidad = { tipo: reporte.entidad.tipo, id: reporte.entidad.id?.toString() }
        this.motivo = reporte.motivo
        this.reglas = reporte.reglas ?? []
        this.estado = reporte.estado
        this.duenio = usuarioResumen(reporte.duenio, true)
        this.notificado = reporte.notificado
        this.fechaNotificacion = reporte.fechaNotificacion
        this.fechaSolucion = reporte.fechaSolucion
        this.fechaUltimoCambio = reporte.fechaUltimoCambio ?? null
        this.revisadoPor = usuarioResumen(reporte.revisadoPor)
        this.fechaRevision = reporte.fechaRevision
        this.comentarioRevision = reporte.comentarioRevision
        this.fechaCreacion = reporte.createdAt
    }

    static desde(reporte) {
        return new ReportePublic(reporte)
    }

    // contenido: textos actuales de la entidad, o null si fue eliminada
    static detalle({ reporte, contenido }) {
        return { ...new ReportePublic(reporte), contenido }
    }
}

class AvisoModeracion {
    constructor({ reporte, nombreEntidad }) {
        this.id = reporte.id
        this.entidad = { tipo: reporte.entidad.tipo, id: reporte.entidad.id?.toString() }
        this.nombreEntidad = nombreEntidad
        this.motivo = reporte.motivo
        this.reglas = reporte.reglas ?? []
        this.fechaNotificacion = reporte.fechaNotificacion
    }

    static desde(aviso) {
        return new AvisoModeracion(aviso)
    }
}

module.exports = { ReportePublic, AvisoModeracion }
