const { z } = require('zod');
const { objectId, alMenosUnCampo } = require('./comunes.js');
const { MedioDeContacto } = require('../models/Contacto.js');

const cuentaGit = z.string({ error: "La cuenta de Git es obligatoria" })
    .regex(/^[a-zA-Z0-9._-]{1,39}$/, "Cuenta de Git inválida");

const contacto = z.object({
    medio: z.enum(Object.values(MedioDeContacto), { error: `El medio de contacto debe ser uno de: ${Object.values(MedioDeContacto).join(', ')}` }),
    valor: z.string({ error: "El valor del contacto es obligatorio" }).min(1, "El valor del contacto no puede estar vacío"),
}).strict();

const campos = {
    nombre: z.string({ error: "El nombre es obligatorio" }).min(1, "El nombre no puede estar vacío"),
    apellido: z.string({ error: "El apellido es obligatorio" }).min(1, "El apellido no puede estar vacío"),
    nombreFantasia: z.string({ error: "El nombre de fantasía debe ser un texto" }),
    pronombres: z.string({ error: "Los pronombres deben ser un texto" }),
    presentacion: z.string({ error: "La presentación debe ser un texto" }).max(300, "La presentación no puede superar los 300 caracteres"),
    habilidades: z.array(objectId("Id de habilidad inválido"), { error: "Las habilidades deben ser una lista de ids" }),
    deseaSerContactado: z.boolean({ error: "deseaSerContactado debe ser un booleano" }),
    contactos: z.array(contacto, { error: "Los contactos deben ser una lista" }),
};

const validarCreacionColaborador = z.object({
    nombre: campos.nombre,
    apellido: campos.apellido,
    cuentaGit,
    nombreFantasia: campos.nombreFantasia.optional(),
    pronombres: campos.pronombres.optional(),
    presentacion: campos.presentacion.optional(),
    habilidades: campos.habilidades.default([]),
    deseaSerContactado: campos.deseaSerContactado.default(false),
    contactos: campos.contactos.default([]),
}).strict();

const validarActualizacionColaborador = z.object(campos).partial().strict()
    .refine(...alMenosUnCampo);

const validarCuentaGitColaborador = z.object({
    cuentaGit,
});

const validarAnotacionAProyecto = z.object({
    cuentaGit,
    idProyecto: objectId("Id de proyecto inválido"),
});

module.exports = {
    validarCreacionColaborador,
    validarActualizacionColaborador,
    validarCuentaGitColaborador,
    validarAnotacionAProyecto,
};
