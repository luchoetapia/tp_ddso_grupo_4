const { z } = require('zod');

const objectId = (mensaje) => z.string({ error: mensaje }).regex(/^[0-9a-fA-F]{24}$/, mensaje);

const alMenosUnCampo = [(data) => Object.keys(data).length > 0, "Debe enviarse al menos un campo para actualizar"];

// Parámetros de paginación de los listados (?pagina=&limite=). Llegan como texto en la query: z.coerce los pasa a número
const LIMITE_MAXIMO = 100;
const paginacion = {
    pagina: z.coerce.number({ error: "La página debe ser un número" })
        .int("La página debe ser un número entero")
        .min(1, "La página debe ser mayor o igual a 1")
        .default(1),
    limite: z.coerce.number({ error: "El límite debe ser un número" })
        .int("El límite debe ser un número entero")
        .min(1, "El límite debe ser mayor o igual a 1")
        .max(LIMITE_MAXIMO, `El límite no puede superar ${LIMITE_MAXIMO}`)
        .default(10),
};

// Ordenamiento de los listados (?orden=&direccion=). 'orden' es la clave de un campo (ej. 'titulo', 'fechaCreacion'):
// acá solo se valida el formato; qué claves existen para cada listado lo define su service
const ordenamiento = {
    orden: z.string({ error: "El orden debe ser un texto" })
        .trim()
        .regex(/^[a-zA-Z]+$/, "El orden debe ser la clave de un campo (solo letras)")
        .optional(),
    direccion: z.enum(['asc', 'desc'], { error: "La dirección debe ser 'asc' o 'desc'" }).optional(),
};

// Query de un listado: paginación + ordenamiento
const validarListado = z.object({ ...paginacion, ...ordenamiento });

module.exports = {
    objectId,
    alMenosUnCampo,
    paginacion,
    ordenamiento,
    validarListado,
};
