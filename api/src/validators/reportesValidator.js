const { z } = require('zod');
const { objectId, paginacion } = require('./comunes.js');
const { EstadoReporte, TipoEntidadReportada } = require('../models/Reporte.js');

const estados = Object.values(EstadoReporte);
const tipos = Object.values(TipoEntidadReportada);

const validarListadoReportes = z.object({
    ...paginacion,
    estado: z.enum(estados, { error: `El estado debe ser uno de: ${estados.join(', ')}` }).optional(),
    tipoEntidad: z.enum(tipos, { error: `El tipo de entidad debe ser uno de: ${tipos.join(', ')}` }).optional(),
});

// El body es opcional: sin body queda sin comentario
const validarResolucionReporte = z.object({
    comentario: z.string({ error: "El comentario debe ser un texto" })
        .trim()
        .min(1, "El comentario no puede estar vacío")
        .max(500, "El comentario no puede superar los 500 caracteres")
        .optional(),
}).strict().default({});

const validarIdsReporte = z.object({
    id: objectId("Id de reporte inválido"),
});

module.exports = {
    validarListadoReportes,
    validarResolucionReporte,
    validarIdsReporte,
};
