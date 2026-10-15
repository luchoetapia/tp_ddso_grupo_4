const { z } = require('zod');
const { objectId, alMenosUnCampo } = require('./comunes.js');

const validarCreacionColaboracion = z.object({
    idProyecto: objectId("Id de proyecto inválido"),
    idColaborador: objectId("Id de colaborador inválido"),
}).strict();

const validarActualizacionColaboracion = z.object({
    esAnonima: z.boolean({ error: "esAnonima debe ser un booleano" }),
    fin: z.iso.datetime({ offset: true, error: "La fecha de fin debe tener formato ISO 8601" }).nullable(),
}).partial().strict()
    .refine(...alMenosUnCampo);

const validarIdsColaboracion = z.object({
    id: objectId("Id de colaboración inválido"),
});

module.exports = {
    validarCreacionColaboracion,
    validarActualizacionColaboracion,
    validarIdsColaboracion,
};
