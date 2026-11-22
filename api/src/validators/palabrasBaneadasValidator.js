const { z } = require('zod');
const { objectId, paginacion } = require('./comunes.js');

const validarCreacionPalabraBaneada = z.object({
    palabra: z.string({ error: "La palabra es obligatoria" })
        .trim()
        .min(1, "La palabra no puede estar vacía")
        .max(50, "La palabra no puede superar los 50 caracteres"),
}).strict();

// ?activa=true|false llega como texto en la query; sin el parámetro se listan todas
const validarListadoPalabrasBaneadas = z.object({
    ...paginacion,
    activa: z.enum(['true', 'false'], { error: "activa debe ser 'true' o 'false'" })
        .transform(valor => valor === 'true')
        .optional(),
});

const validarIdsPalabraBaneada = z.object({
    id: objectId("Id de palabra baneada inválido"),
});

module.exports = {
    validarCreacionPalabraBaneada,
    validarListadoPalabrasBaneadas,
    validarIdsPalabraBaneada,
};
