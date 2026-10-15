const { z } = require('zod');
const { objectId, alMenosUnCampo } = require('./comunes.js');

const enlace = (mensaje) => z.url({ error: mensaje }).nullable();

const validarCreacionProyecto = z.object({
    titulo: z.string({ error: "El título del proyecto es obligatorio" }).min(1, "El título del proyecto no puede estar vacío"),
    descripcion: z.string({ error: "La descripción del proyecto es obligatoria" }).min(1, "La descripción del proyecto no puede estar vacía"),
    perfiles: z.array(objectId("Id de perfil inválido"), { error: "Los perfiles deben ser una lista de ids" }).default([]),
    enlaceSistema: enlace("El enlace al sistema debe ser una URL válida").optional(),
    enlaceCodigoFuente: enlace("El enlace al código fuente debe ser una URL válida").optional(),
}).strict();

const validarActualizacionProyecto = z.object({
    titulo: validarCreacionProyecto.shape.titulo,
    descripcion: validarCreacionProyecto.shape.descripcion,
    perfiles: z.array(objectId("Id de perfil inválido"), { error: "Los perfiles deben ser una lista de ids" }),
    enlaceSistema: enlace("El enlace al sistema debe ser una URL válida"),
    enlaceCodigoFuente: enlace("El enlace al código fuente debe ser una URL válida"),
}).partial().strict()
    .refine(...alMenosUnCampo);

const validarFinalizacionProyecto = z.object({
    idColectivo: objectId("Id de colectivo inválido"),
}).strict();

const validarContactoColaborador = z.object({
    cuentaGit: z.string({ error: "La cuenta de Git es obligatoria" }).min(1, "La cuenta de Git no puede estar vacía"),
    mensaje: z.string({ error: "El mensaje es obligatorio" }).min(1, "El mensaje no puede estar vacío"),
}).strict();

const validarIdsProyecto = z.object({
    id: objectId("Id de proyecto inválido"),
});

const validarIdsPerfilDeProyecto = z.object({
    id: objectId("Id de proyecto inválido"),
    idPerfil: objectId("Id de perfil inválido"),
});

module.exports = {
    validarCreacionProyecto,
    validarActualizacionProyecto,
    validarFinalizacionProyecto,
    validarContactoColaborador,
    validarIdsProyecto,
    validarIdsPerfilDeProyecto,
}
