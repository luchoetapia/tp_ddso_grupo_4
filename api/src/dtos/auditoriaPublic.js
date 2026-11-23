const idDe = (ref) => (ref?._id ?? ref)?.toString() ?? null;

class AuditoriaPublic {
    constructor(registro) {
        this.id = idDe(registro)
        this.accion = registro.accion
        this.entidad = { tipo: registro.entidad?.tipo, id: idDe(registro.entidad?.id) }
        this.autor = registro.autor
            ? { id: idDe(registro.autor.id), username: registro.autor.username, rol: registro.autor.rol }
            : null
        this.idColectivo = idDe(registro.colectivo)
        this.detalle = registro.detalle ?? null
        this.fecha = registro.fecha
    }

    static desde(registro) {
        return new AuditoriaPublic(registro)
    }
}

module.exports = { AuditoriaPublic }
