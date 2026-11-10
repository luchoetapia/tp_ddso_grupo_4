class ColaboracionPublic {
    constructor(id, colaborador, proyecto, inicio, fin, esAnonima) {
        this.id = id
        // Si la colaboración es anónima no se expone quién colaboró
        this.colaborador = esAnonima ? null : { id: colaborador.id, cuentaGit: colaborador.cuentaGit }
        this.proyecto = { id: proyecto.id, titulo: proyecto.titulo }
        this.inicio = inicio
        this.fin = fin
        this.esAnonima = esAnonima
    }

    static desde(colaboracion) {
        return new ColaboracionPublic(
            colaboracion.id,
            colaboracion.colaborador,
            colaboracion.proyecto,
            colaboracion.inicio,
            colaboracion.fin,
            colaboracion.esAnonima
        )
    }
}

module.exports = { ColaboracionPublic }
