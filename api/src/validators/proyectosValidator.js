const { z } = require('zod');
const { objectId, alMenosUnCampo } = require('./comunes.js');
const { Periodo } = require('../models/proyecto.js');

const enlace = (mensaje) => z.url({ error: mensaje }).nullable();

// ---------- Perfiles (embebidos en el proyecto) ----------

const habilidades = z.array(objectId("Id de habilidad inválido"), { error: "Las habilidades deben ser una lista de ids" });

const tipoCompromiso = z.object({
    cantHoras: z.number({ error: "La cantidad de horas debe ser un número" }).positive("La cantidad de horas debe ser mayor a 0"),
    periodo: z.enum(Object.values(Periodo), { error: `El período debe ser uno de: ${Object.values(Periodo).join(', ')}` }),
}, { error: "El tipo de compromiso es obligatorio" }).strict();

const incentivoEconomico = z.number({ error: "El incentivo económico debe ser un número" }).min(0, "El incentivo económico no puede ser negativo");
const posibleContratacion = z.boolean({ error: "posibleContratacion debe ser un booleano" });

const validarCreacionPerfil = z.object({
    titulo: z.string({ error: "El título del perfil es obligatorio" }).min(1, "El título del perfil no puede estar vacío"),
    descripcion: z.string({ error: "La descripción del perfil es obligatoria" }).min(1, "La descripción del perfil no puede estar vacía"),
    habilidadesRequeridas: habilidades.default([]),
    habilidadesOpcionales: habilidades.default([]),
    tipoCompromiso,
    modalidadColaboracion: z.object({
        incentivoEconomico: incentivoEconomico.default(0),
        posibleContratacion: posibleContratacion.default(false),
    }, { error: "La modalidad de colaboración es obligatoria" }).strict(),
    busquedaAbierta: z.boolean({ error: "busquedaAbierta debe ser un booleano" }).default(true),
    limiteColaboraciones: z.number().int().positive("El límite de colaboraciones debe ser mayor a 0").optional().nullable(),
    fechaFinBusqueda: z.coerce.date({ error: "La fecha de fin de búsqueda es inválida" }).optional().nullable(),
}).strict();

// Sin defaults: los campos que no se envían no deben pisar los valores guardados
const validarActualizacionPerfil = z.object({
    titulo: validarCreacionPerfil.shape.titulo,
    descripcion: validarCreacionPerfil.shape.descripcion,
    habilidadesRequeridas: habilidades,
    habilidadesOpcionales: habilidades,
    tipoCompromiso,
    modalidadColaboracion: z.object({
        incentivoEconomico,
        posibleContratacion,
    }, { error: "La modalidad de colaboración debe ser un objeto" }).strict(),
    busquedaAbierta: z.boolean({ error: "busquedaAbierta debe ser un booleano" }),
    limiteColaboraciones: z.number().int().positive("El límite de colaboraciones debe ser mayor a 0").nullable(),
    fechaFinBusqueda: z.coerce.date({ error: "La fecha de fin de búsqueda es inválida" }).nullable(),
}).partial().strict()
    .refine(...alMenosUnCampo);

// ---------- Proyectos ----------

const validarCreacionProyecto = z.object({
    titulo: z.string({ error: "El título del proyecto es obligatorio" }).min(1, "El título del proyecto no puede estar vacío"),
    descripcion: z.string({ error: "La descripción del proyecto es obligatoria" }).min(1, "La descripción del proyecto no puede estar vacía"),
    perfiles: z.array(validarCreacionPerfil, { error: "Los perfiles deben ser una lista" }).default([]),
    enlaceSistema: enlace("El enlace al sistema debe ser una URL válida").optional(),
    enlaceCodigoFuente: enlace("El enlace al código fuente debe ser una URL válida").optional(),
}).strict();

const validarActualizacionProyecto = z.object({
    titulo: validarCreacionProyecto.shape.titulo,
    descripcion: validarCreacionProyecto.shape.descripcion,
    enlaceSistema: enlace("El enlace al sistema debe ser una URL válida"),
    enlaceCodigoFuente: enlace("El enlace al código fuente debe ser una URL válida"),
}).partial().strict()
    .refine(...alMenosUnCampo);

const validarFiltrosProyecto = z.object({
    texto: z.string({ error: "El filtro 'texto' debe ser un texto" }).trim().optional(),
});

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
    validarCreacionPerfil,
    validarActualizacionPerfil,
    validarCreacionProyecto,
    validarActualizacionProyecto,
    validarFiltrosProyecto,
    validarFinalizacionProyecto,
    validarContactoColaborador,
    validarIdsProyecto,
    validarIdsPerfilDeProyecto,
}
