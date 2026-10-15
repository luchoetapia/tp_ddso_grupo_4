const { z } = require('zod');
const { objectId } = require('./comunes.js');

const validarCreacionLogro = z.object({
    titulo: z.string({ error: "El título del logro es obligatorio" }).min(1, "El título del logro no puede estar vacío"),
    descripcion: z.string({ error: "La descripción del logro es obligatoria" }).min(1, "La descripción del logro no puede estar vacía"),
}).strict();

const validarActualizacionLogro = validarCreacionLogro.partial();

const validarIdsLogro = z.object({
    id: objectId("Id de proyecto inválido"),
    idLogro: objectId("Id de logro inválido"),
});

module.exports = {
    validarCreacionLogro,
    validarActualizacionLogro,
    validarIdsLogro,
};
