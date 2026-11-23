const { z } = require('zod');
const { objectId, paginacion } = require('./comunes.js');
const { AccionAuditada, TipoEntidadAuditada } = require('../models/Auditoria.js');

const acciones = Object.values(AccionAuditada);
const tiposEntidad = Object.values(TipoEntidadAuditada);

const fecha = (nombre) => z.coerce.date({ error: `'${nombre}' debe ser una fecha válida (ej: 2026-11-23)` });

// 'hasta' sin hora (2026-11-23) incluye todo ese día
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const UN_DIA_MS = 24 * 60 * 60 * 1000;
const fechaHasta = z.preprocess(
    (valor) => typeof valor === 'string' && SOLO_FECHA.test(valor) ? new Date(Date.parse(valor) + UN_DIA_MS - 1) : valor,
    fecha('hasta')
);

// Filtros del historial de un colectivo (el colectivo sale de la sesión)
const validarFiltrosAuditoriaColectivo = z.object({
    accion: z.enum(acciones, { error: `La acción debe ser una de: ${acciones.join(', ')}` }).optional(),
    tipoEntidad: z.enum(tiposEntidad, { error: `El tipo de entidad debe ser uno de: ${tiposEntidad.join(', ')}` }).optional(),
    idEntidad: objectId("Id de entidad inválido").optional(),
    idAutor: objectId("Id de autor inválido").optional(),
    desde: fecha('desde').optional(),
    hasta: fechaHasta.optional(),
    ...paginacion,
}).refine(
    ({ desde, hasta }) => !desde || !hasta || desde <= hasta,
    { message: "'desde' no puede ser posterior a 'hasta'", path: ['desde'] }
);

// Filtros del historial completo (admin): además se puede filtrar por colectivo
const validarFiltrosAuditoria = validarFiltrosAuditoriaColectivo.safeExtend({
    idColectivo: objectId("Id de colectivo inválido").optional(),
});

module.exports = {
    validarFiltrosAuditoria,
    validarFiltrosAuditoriaColectivo,
};
