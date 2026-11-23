// Acciones que quedan registradas en la auditoría (trazabilidad de lo que se hace sobre colectivos, proyectos y colaboraciones)
const AccionAuditada = {
    // Colectivos
    COLECTIVO_CREADO: 'colectivo_creado',
    COLECTIVO_ACTUALIZADO: 'colectivo_actualizado',
    COLECTIVO_DADO_DE_BAJA: 'colectivo_dado_de_baja',
    ADMINISTRADOR_AGREGADO: 'administrador_agregado',
    ADMINISTRADOR_QUITADO: 'administrador_quitado',

    // Proyectos
    PROYECTO_CREADO: 'proyecto_creado',
    PROYECTO_ACTUALIZADO: 'proyecto_actualizado',
    PROYECTO_FINALIZADO: 'proyecto_finalizado',
    PERFIL_CREADO: 'perfil_creado',
    PERFIL_ACTUALIZADO: 'perfil_actualizado',
    PERFIL_ELIMINADO: 'perfil_eliminado',
    LOGRO_CREADO: 'logro_creado',
    LOGRO_ACTUALIZADO: 'logro_actualizado',
    LOGRO_ELIMINADO: 'logro_eliminado',

    // Postulaciones y colaboraciones
    POSTULACION_CREADA: 'postulacion_creada',
    POSTULACION_ACEPTADA: 'postulacion_aceptada',
    POSTULACION_RECHAZADA: 'postulacion_rechazada',
    COLABORACION_CREADA: 'colaboracion_creada',
    COLABORACION_DADA_DE_BAJA: 'colaboracion_dada_de_baja',

    // Revisión de denuncias (reportes)
    REPORTE_NOTIFICADO: 'reporte_notificado',
    REPORTE_VALIDADO: 'reporte_validado',
    REPORTE_RECHAZADO: 'reporte_rechazado',
}

const TipoEntidadAuditada = {
    COLECTIVO: 'Colectivo',
    PROYECTO: 'Proyecto',
    POSTULACION: 'Postulacion',
    COLABORACION: 'Colaboracion',
    REPORTE: 'Reporte',
}

class Auditoria {
    // autor: { id, username, rol } de quien hizo la acción (null si fue una llamada sin sesión).
    // colectivo: colectivo afectado (para que cada colectivo vea su propio historial), o null.
    constructor(accion, entidad, autor, colectivo = null, detalle = null, fecha = new Date()) {
        this.accion = accion
        this.entidad = entidad
        this.autor = autor
        this.colectivo = colectivo
        this.detalle = detalle
        this.fecha = fecha
    }
}

module.exports = { Auditoria, AccionAuditada, TipoEntidadAuditada }
