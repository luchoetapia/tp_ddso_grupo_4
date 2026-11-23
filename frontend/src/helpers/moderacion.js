// Textos de la pantalla de Moderación (reportes de /reportes)

// Se dispara al resolver un reporte, para que la navegación actualice el contador de pendientes
export const EVENTO_MODERACION_ACTUALIZADA = "moderacion:actualizada";

export const ESTADOS_REPORTE = [
    { valor: "Pendiente", texto: "Pendientes", variante: "highlight" },
    { valor: "Solucionado", texto: "Solucionados (corregidos por el dueño)", variante: "accent" },
    { valor: "Validado", texto: "Dados de baja", variante: "error" },
    { valor: "Rechazado", texto: "Desestimados", variante: "neutral" },
];

export const TIPOS_REPORTADOS = [
    { valor: "Proyecto", texto: "Proyecto" },
    { valor: "Colectivo", texto: "Organización" },
    { valor: "Colaborador", texto: "Colaborador/a" },
    { valor: "Postulacion", texto: "Postulación" },
];

export const TEXTO_REGLA = {
    palabras_prohibidas: "Contenido inapropiado",
    fin_de_lucro: "Posible fin de lucro",
    codigo_cerrado: "Código no público",
};

const porValor = (lista) => Object.fromEntries(lista.map((item) => [item.valor, item]));
export const ESTADO = porValor(ESTADOS_REPORTE);
export const TIPO = porValor(TIPOS_REPORTADOS);
