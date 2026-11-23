const EstadoReporte = {
    PENDIENTE: 'Pendiente',
    RECHAZADO: 'Rechazado',
    VALIDADO: 'Validado',
    // Se notificó y el usuario editó la entidad reportada
    SOLUCIONADO: 'Solucionado'
}

const TipoEntidadReportada = {
    PROYECTO: 'Proyecto',
    POSTULACION: 'Postulacion',
    COLABORADOR: 'Colaborador',
    COLECTIVO: 'Colectivo'
}

class Reporte {
    // reglas: reglas de moderación automática que dispararon el reporte (ver models/moderacion)
    constructor(entidad, motivo, duenio = null, estado = EstadoReporte.PENDIENTE, reglas = []) {
        this.entidad = entidad;
        this.motivo = motivo;
        this.reglas = reglas;
        this.duenio = duenio;
        this.estado = estado;
        this.notificado = false;
        this.fechaNotificacion = null;
        this.fechaSolucion = null;
        this.fechaUltimoCambio = null;
        this.revisadoPor = null;
        this.fechaRevision = null;
        this.comentarioRevision = null;
    }

    estaPendiente() { return this.estado === EstadoReporte.PENDIENTE }
}

module.exports = { Reporte, EstadoReporte, TipoEntidadReportada };
