const { z } = require('zod');
const { objectId, alMenosUnCampo } = require('./comunes.js');
const { TipoColectivo } = require('../models/dominio.js');

const campos = {
    nombre: z.string({ error: "El nombre del colectivo es obligatorio" }).min(1, "El nombre del colectivo no puede estar vacío"),
    descripcion: z.string({ error: "La descripción debe ser un texto" }),
    ubicacion: z.string({ error: "La ubicación debe ser un texto" }),
    tipo: z.enum(Object.values(TipoColectivo), { error: `El tipo de colectivo debe ser uno de: ${Object.values(TipoColectivo).join(', ')}` }),
    proyectos: z.array(objectId("Id de proyecto inválido"), { error: "Los proyectos deben ser una lista de ids" }),
};

const validarCreacionColectivo = z.object({
    nombre: campos.nombre,
    tipo: campos.tipo,
    descripcion: campos.descripcion.optional(),
    ubicacion: campos.ubicacion.optional(),
    proyectos: campos.proyectos.default([]),
}).strict();

const validarActualizacionColectivo = z.object(campos).partial().strict()
    .refine(...alMenosUnCampo);

const validarIdsColectivo = z.object({
    id: objectId("Id de colectivo inválido"),
});

module.exports = {
    validarCreacionColectivo,
    validarActualizacionColectivo,
    validarIdsColectivo,
};
