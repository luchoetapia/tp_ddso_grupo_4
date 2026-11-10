const { z } = require('zod');
const { objectId } = require('./comunes.js');
const EstadoPostulacion = require('../models/Proyecto/Postulaciones/EstadoPostulacion.js');

const estadosValidos = Object.values(EstadoPostulacion);

const validarCreacionPostulacion = z.object({
    idProyecto: objectId("Id de proyecto inválido"),
    idPerfil: objectId("Id de perfil inválido"),
    idColaborador: objectId("Id de colaborador inválido").optional(),
    cuentaGit: z.string().trim().min(1, "La cuentaGit no puede estar vacía").optional(),
    mensaje: z.string().optional().default("")
}).refine(
    data => data.idColaborador || data.cuentaGit,
    { message: "Debe proveer idColaborador o cuentaGit", path: ["idColaborador"] }
);

const validarFiltrosPostulaciones = z.object({
    idProyecto: objectId("Id de proyecto inválido").optional(),
    idPerfil: objectId("Id de perfil inválido").optional(),
    idColaborador: objectId("Id de colaborador inválido").optional(),
    idColectivo: objectId("Id de colectivo inválido").optional(),
    estado: z.enum(estadosValidos, { error: "Estado de postulación inválido" }).optional()
}).partial();

const validarIdPostulacion = z.object({
    id: objectId("Id de postulación inválido")
});

const validarCambioEstado = z.object({
    estado: z.enum([EstadoPostulacion.ACEPTADA, EstadoPostulacion.RECHAZADA], {
        error: `El estado debe ser '${EstadoPostulacion.ACEPTADA}' o '${EstadoPostulacion.RECHAZADA}'`
    })
});

module.exports = {
    validarCreacionPostulacion,
    validarFiltrosPostulaciones,
    validarIdPostulacion,
    validarCambioEstado
};
