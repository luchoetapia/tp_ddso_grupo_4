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

// Un proyecto no tiene habilidades propias: se juntan las de sus perfiles, sin repetir
const habilidadesDePerfiles = (perfiles, campo) => {
    const habilidades = perfiles.flatMap(perfil => perfil[campo] ?? []);
    return [...new Map(habilidades.map(h => [h.id, h])).values()];
}

const toProyectoPublic = (proyecto) => {
    const perfiles = proyecto.perfiles ?? [];
    return new ProyectosPublic(
        proyecto.id,
        proyecto.titulo,
        proyecto.descripcion,
        proyecto.finalizado,
        proyecto.porcentajeFinalizado,
        habilidadesDePerfiles(perfiles, 'habilidadesRequeridas'),
        habilidadesDePerfiles(perfiles, 'habilidadesOpcionales')
    )
}

module.exports = { toColaboracionPublic, toColaboradorPublic, toColectivoPublic, toProyectoPublic }
