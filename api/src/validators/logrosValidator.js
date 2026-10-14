const { z } = require('zod');

const validarCreacionLogro = z.object({
    nombre: z.string().min(1, "El nombre del logro no puede estar vacío"),
    descripcion: z.string().min(1, "La descripción del logro no puede estar vacía"),
    fecha: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "La fecha debe ser una fecha válida",
    }),
});

const validarActualizacionLogro = z.object({
    nombre: z.string().min(1, "El nombre del logro no puede estar vacío").optional(),
    descripcion: z.string().min(1, "La descripción del logro no puede estar vacía").optional(),
    fecha: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "La fecha debe ser una fecha válida",
    }).optional(),
});

const validarIdsLogro = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Id de proyecto inválido"),
    idLogro: z.string().regex(/^[0-9a-fA-F]{24}$/, "Id de logro inválido"),
});

module.exports = {
    validarCreacionLogro,
    validarActualizacionLogro,
    validarIdsLogro,
};