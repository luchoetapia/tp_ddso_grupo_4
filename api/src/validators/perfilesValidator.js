const { z } = require('zod');
const { objectId, alMenosUnCampo } = require('./comunes.js');
const { Periodo } = require('../models/proyecto.js');

const habilidades = z.array(objectId("Id de habilidad inválido"), { error: "Las habilidades deben ser una lista de ids" });

const tipoCompromiso = z.object({
    cantHoras: z.number({ error: "La cantidad de horas debe ser un número" }).positive("La cantidad de horas debe ser mayor a 0"),
    periodo: z.enum(Object.values(Periodo), { error: `El período debe ser uno de: ${Object.values(Periodo).join(', ')}` }),
}, { error: "El tipo de compromiso es obligatorio" }).strict();

const incentivoEconomico = z.number({ error: "El incentivo económico debe ser un número" }).min(0, "El incentivo económico no puede ser negativo");
const posibleContratacion = z.boolean({ error: "posibleContratacion debe ser un booleano" });

const validarCreacionPerfil = z.object({
    descripcion: z.string({ error: "La descripción del perfil es obligatoria" }).min(1, "La descripción del perfil no puede estar vacía"),
    habilidadesRequeridas: habilidades.default([]),
    habilidadesOpcionales: habilidades.default([]),
    tipoCompromiso,
    modalidadColaboracion: z.object({
        incentivoEconomico: incentivoEconomico.default(0),
        posibleContratacion: posibleContratacion.default(false),
    }, { error: "La modalidad de colaboración es obligatoria" }).strict(),
}).strict();

// Sin defaults: los campos que no se envían no deben pisar los valores guardados
const validarActualizacionPerfil = z.object({
    descripcion: validarCreacionPerfil.shape.descripcion,
    habilidadesRequeridas: habilidades,
    habilidadesOpcionales: habilidades,
    tipoCompromiso,
    modalidadColaboracion: z.object({
        incentivoEconomico,
        posibleContratacion,
    }, { error: "La modalidad de colaboración debe ser un objeto" }).strict(),
}).partial().strict()
    .refine(...alMenosUnCampo);

const validarIdsPerfil = z.object({
    id: objectId("Id de perfil inválido"),
});

module.exports = {
    validarCreacionPerfil,
    validarActualizacionPerfil,
    validarIdsPerfil,
};
