const { z } = require('zod');
const { objectId, alMenosUnCampo } = require('./comunes.js');
const { TipoHabilidad } = require('../models/habilidad.js');

const validarCreacionHabilidad = z.object({
    titulo: z.string({ error: "El título de la habilidad es obligatorio" }).min(1, "El título de la habilidad no puede estar vacío"),
    tipoHabilidad: z.enum(Object.values(TipoHabilidad), { error: `El tipo de habilidad debe ser uno de: ${Object.values(TipoHabilidad).join(', ')}` }),
    descripcion: z.string({ error: "La descripción de la habilidad es obligatoria" }).min(1, "La descripción de la habilidad no puede estar vacía"),
}).strict();

const validarActualizacionHabilidad = validarCreacionHabilidad.partial()
    .refine(...alMenosUnCampo);

const validarIdsHabilidad = z.object({
    id: objectId("Id de habilidad inválido"),
});

module.exports = {
    validarCreacionHabilidad,
    validarActualizacionHabilidad,
    validarIdsHabilidad,
};
