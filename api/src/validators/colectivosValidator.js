const { z } = require('zod');
const { objectId, alMenosUnCampo, paginacion, ordenamiento } = require('./comunes.js');
const { TipoColectivo, normalizarUbicacion } = require('../models/colectivo.js');
const { validarRegistro } = require('../auth/authValidator.js');

const LARGO_MAXIMO_UBICACION = 100;

const campos = {
    nombre: z.string({ error: "El nombre del colectivo es obligatorio" }).min(1, "El nombre del colectivo no puede estar vacío"),
    descripcion: z.string({ error: "La descripción es obligatoria" }).trim().min(1, "La descripción no puede estar vacía"),
    ubicacion: z.string({ error: "La ubicación debe ser un texto" })
        .trim()
        .max(LARGO_MAXIMO_UBICACION, `La ubicación no puede superar los ${LARGO_MAXIMO_UBICACION} caracteres`)
        .transform((texto) => (texto === '' ? null : normalizarUbicacion(texto)))
        .nullable(),
    tipo: z.enum(Object.values(TipoColectivo), { error: `El tipo de colectivo debe ser uno de: ${Object.values(TipoColectivo).join(', ')}` }),
    proyectos: z.array(objectId("Id de proyecto inválido"), { error: "Los proyectos deben ser una lista de ids" }),
};

const validarCreacionColectivo = z.object({
    nombre: campos.nombre,
    tipo: campos.tipo,
    descripcion: campos.descripcion,
    ubicacion: campos.ubicacion.optional(),
    proyectos: campos.proyectos.default([]),
}).strict();

const validarActualizacionColectivo = z.object({
    nombre: campos.nombre,
    tipo: campos.tipo,
    descripcion: campos.descripcion,
    ubicacion: campos.ubicacion,
}).partial().strict()
    .refine(...alMenosUnCampo);

const validarIdsColectivo = z.object({
    id: objectId("Id de colectivo inválido"),
});

const validarFiltrosColectivo = z.object({
    activos: z.enum(['true', 'false'], { error: "El filtro 'activos' debe ser 'true' o 'false'" }).optional(),
    ...paginacion,
    ...ordenamiento,
});

// ?proyectos=id1,id2 -> ['id1', 'id2'] (cada uno tiene que ser un id válido)
const listaDeProyectos = z.string({ error: "El filtro 'proyectos' debe ser una lista de ids separada por comas" })
    .transform((valor) => valor.split(',').map((id) => id.trim()).filter(Boolean))
    .pipe(z.array(objectId("Id de proyecto inválido")));

const validarFiltrosPotencialesColaboradores = z.object({
    proyectos: listaDeProyectos.optional(),
    ...paginacion,
    ...ordenamiento,
});

const validarCreacionAdministrador = validarRegistro.pick({ username: true, email: true, password: true }).strict();

const validarIdAdministrador = z.object({
    idUsuario: objectId("Id de usuario inválido"),
});

module.exports = {
    validarCreacionAdministrador,
    validarIdAdministrador,
    validarCreacionColectivo,
    validarActualizacionColectivo,
    validarIdsColectivo,
    validarFiltrosColectivo,
    validarFiltrosPotencialesColaboradores
};
