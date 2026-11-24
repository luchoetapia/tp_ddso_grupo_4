// Textos legibles de las acciones que registra la auditoría (GET /colectivos/me/auditoria)
export const TEXTO_ACCION = {
    colectivo_creado: "Registró la organización",
    colectivo_actualizado: "Editó los datos de la organización",
    colectivo_dado_de_baja: "Dio de baja la organización",
    administrador_agregado: "Agregó un administrador",
    administrador_quitado: "Quitó un administrador",
    proyecto_creado: "Creó un proyecto",
    proyecto_actualizado: "Editó un proyecto",
    proyecto_finalizado: "Finalizó un proyecto",
    proyecto_eliminado: "Eliminó un proyecto",
    perfil_creado: "Agregó un perfil a un proyecto",
    perfil_actualizado: "Editó un perfil de un proyecto",
    perfil_eliminado: "Eliminó un perfil de un proyecto",
    logro_creado: "Cargó un logro",
    logro_actualizado: "Editó un logro",
    logro_eliminado: "Eliminó un logro",
    postulacion_creada: "Se recibió una postulación",
    postulacion_aceptada: "Aceptó una postulación",
    postulacion_rechazada: "Rechazó una postulación",
    colaboracion_creada: "Se sumó una colaboración",
    colaboracion_dada_de_baja: "Dio de baja una colaboración",
    publicacion_linkedin: "Publicó en LinkedIn",
    reporte_notificado: "Moderación: pidió corregir contenido denunciado",
    reporte_validado: "Moderación: dio de baja contenido denunciado",
    reporte_rechazado: "Moderación: desestimó una denuncia",
};

export const TIPOS_ENTIDAD = [
    { valor: "Colectivo", texto: "Organización" },
    { valor: "Proyecto", texto: "Proyectos" },
    { valor: "Postulacion", texto: "Postulaciones" },
    { valor: "Colaboracion", texto: "Colaboraciones" },
    { valor: "Reporte", texto: "Moderación" },
];

const TEXTO_ROL = { colectivo: "Organización", colaborador: "Colaborador/a", admin: "Equipo de Código a Voluntad" };

export const textoAccion = (accion) => TEXTO_ACCION[accion] ?? accion;

export const textoAutor = (autor) => (autor ? `${autor.username} (${TEXTO_ROL[autor.rol] ?? autor.rol})` : "Sistema");
