const idDe = (ref) => (ref?._id ?? ref)?.toString();

class Colectivo {
    // usuario: cuenta titular (la que registró el colectivo).
    // administradores: cuentas adicionales que también administran el colectivo.
    constructor(id, usuario, nombre, descripcion, ubicacion, tipo, proyectos, administradores = []) {
        this.id = id
        this.usuario = usuario
        this.nombre = nombre
        this.descripcion = descripcion
        this.ubicacion = ubicacion
        this.tipo = tipo
        this.proyectos = proyectos
        this.administradores = administradores
    }

    esTitular(idUsuario) {
        return !!idUsuario && idDe(this.usuario) === idUsuario.toString()
    }

    esAdministradorAdicional(idUsuario) {
        return !!idUsuario && (this.administradores ?? []).some(admin => idDe(admin) === idUsuario.toString())
    }

    // Titular o administrador adicional: cualquiera de los dos puede gestionar el colectivo
    puedeAdministrar(idUsuario) {
        return this.esTitular(idUsuario) || this.esAdministradorAdicional(idUsuario)
    }
}

const TipoColectivo = {
    FUNDACION: 'fundacion',
    ASOCIACION_BARRIAL: 'asociacion_barrial',
    ONG: 'ong',
    ASAMBLEA: 'asamblea',
}

module.exports = {Colectivo, TipoColectivo}
