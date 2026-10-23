const { ColaboracionPublic } = require('./colaboracionPublic.js');
const { ColaboradorPublic } = require('./colaboradorPublic.js');
const { ColectivoPublic } = require('./colectivoPublic.js');
const { ProyectosPublic } = require('./proyectosPublic.js');

const toColaboracionPublic = (colaboracion) => new ColaboracionPublic(
    colaboracion.id,
    colaboracion.colaborador,
    colaboracion.proyecto,
    colaboracion.inicio,
    colaboracion.fin
)

const toColaboradorPublic = (colaborador) => new ColaboradorPublic(
    colaborador.id,
    colaborador.nombre,
    colaborador.apellido,
    colaborador.nombreFantasia,
    colaborador.cuentaGit,
    colaborador.habilidades ?? [],
    colaborador.presentacion,
    colaborador.deseaSerContactado
)

const toColectivoPublic = (colectivo) => new ColectivoPublic(
    colectivo.id,
    colectivo.nombre,
    colectivo.descripcion,
    colectivo.ubicacion,
    colectivo.tipo,
    colectivo.proyectos ?? []
)

const toProyectoPublic = (proyecto) => new ProyectosPublic(
    proyecto.id,
    proyecto.titulo,
    proyecto.descripcion,
    proyecto.finalizado,
    proyecto.porcentajeFinalizado,
    proyecto.perfiles ?? []
)

module.exports = { toColaboracionPublic, toColaboradorPublic, toColectivoPublic, toProyectoPublic }
