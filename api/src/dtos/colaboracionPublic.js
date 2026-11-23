const idDe = (ref) => (ref?._id ?? ref)?.toString() ?? null;

class ColaboracionPublic {
    constructor(id, colaborador, proyecto, idPerfil, inicio, fin, esAnonima) {
        this.id = id
        // Si la colaboración es anónima no se expone quién colaboró
        this.colaborador = esAnonima ? null : {
            nombre: colaborador?.nombre ?? null,
            apellido: colaborador?.apellido ?? null,
            nombreFantasia: colaborador?.nombreFantasia ?? null,
            cuentaGit: colaborador?.cuentaGit ?? null,
        }
        this.proyecto = { id: proyecto.id, titulo: proyecto.titulo }
        this.idPerfil = idPerfil
        this.inicio = inicio
        this.fin = fin
        this.activa = !fin
        this.esAnonima = esAnonima
    }

    static desde(colaboracion) {
        return new ColaboracionPublic(
            colaboracion.id,
            colaboracion.colaborador,
            colaboracion.proyecto,
            idDe(colaboracion.perfil),
            colaboracion.inicio,
            colaboracion.fin,
            colaboracion.esAnonima
        )
    }
}

module.exports = { ColaboracionPublic }
