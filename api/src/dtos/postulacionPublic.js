const idDe = (ref) => (ref?._id ?? ref)?.toString();

class PostulacionPublic {
    constructor(id, estado, mensaje, fecha, idPerfil, proyecto, colaborador) {
        this.id = id
        this.estado = estado
        this.mensaje = mensaje
        this.fecha = fecha
        this.idPerfil = idPerfil
        this.proyecto = proyecto
        this.colaborador = colaborador
    }

    static desde(postulacion) {
        const { proyecto, colaborador } = postulacion;
        return new PostulacionPublic(
            idDe(postulacion),
            postulacion.estado,
            postulacion.mensaje,
            postulacion.fecha,
            idDe(postulacion.perfil),
            { id: idDe(proyecto), titulo: proyecto?.titulo },
            {
                id: idDe(colaborador),
                cuentaGit: colaborador?.cuentaGit,
                nombreFantasia: colaborador?.nombreFantasia,
                nombre: colaborador?.nombre,
                apellido: colaborador?.apellido,
            }
        )
    }
}

module.exports = { PostulacionPublic }
