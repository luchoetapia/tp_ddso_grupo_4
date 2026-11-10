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

module.exports = { ColaboradorPublic }
