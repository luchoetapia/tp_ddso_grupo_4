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

const PROVINCIAS = [
    'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa',
    'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
    'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
]
const UBICACIONES_PREDEFINIDAS = ['Argentina', 'CABA', ...PROVINCIAS]

const sinTildesNiMayusculas = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const normalizarUbicacion = (texto) => {
    const buscado = sinTildesNiMayusculas(texto)
    return UBICACIONES_PREDEFINIDAS.find(u => sinTildesNiMayusculas(u) === buscado) ?? texto
}

module.exports = { Colectivo, TipoColectivo, PROVINCIAS, UBICACIONES_PREDEFINIDAS, normalizarUbicacion }
