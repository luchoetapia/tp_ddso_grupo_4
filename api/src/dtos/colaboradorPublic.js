const { HabilidadResumen } = require('./habilidadPublic.js');

class ColaboradorPublic {
    constructor(id, nombre, apellido, nombreFantasia, cuentaGit, habilidades, pronombres, presentacion, deseaSerContactado) {
        this.id = id
        this.nombre = nombre
        this.apellido = apellido
        this.nombreFantasia = nombreFantasia
        this.cuentaGit = cuentaGit
        this.habilidades = HabilidadResumen.desdeLista(habilidades)
        this.pronombres = pronombres
        this.presentacion = presentacion
        this.deseaSerContactado = deseaSerContactado
    }

    static desde(colaborador) {
        return new ColaboradorPublic(
            colaborador.id,
            colaborador.nombre,
            colaborador.apellido,
            colaborador.nombreFantasia,
            colaborador.cuentaGit,
            colaborador.habilidades,
            colaborador.pronombres,
            colaborador.presentacion,
            colaborador.deseaSerContactado
        )
    }
}

// Colaborador de una búsqueda de un colectivo
class ColaboradorCompatible extends ColaboradorPublic {
    constructor(colaborador, perfilesCompatibles = []) {
        super(
            colaborador.id,
            colaborador.nombre,
            colaborador.apellido,
            colaborador.nombreFantasia,
            colaborador.cuentaGit,
            colaborador.habilidades,
            colaborador.pronombres,
            colaborador.presentacion,
            colaborador.deseaSerContactado
        )
        this.perfilesCompatibles = perfilesCompatibles.map(({ proyecto, perfil }) => ({
            proyecto: { id: proyecto.id, titulo: proyecto.titulo },
            perfil: { id: perfil.id, titulo: perfil.titulo },
        }))
    }

    static desde({ colaborador, perfilesCompatibles }) {
        return new ColaboradorCompatible(colaborador, perfilesCompatibles)
    }
}

module.exports = { ColaboradorPublic, ColaboradorCompatible }
