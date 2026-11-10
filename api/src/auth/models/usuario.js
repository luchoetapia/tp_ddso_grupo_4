const roles = {
    ADMIN: 'admin',
    COLABORADOR: 'colaborador',
    COLECTIVO: 'colectivo'
}

class Usuario {
    constructor(id, username, password, email, rol, activo = true, ultimoAcceso = new Date()) {
        this.id = id
        this.username = username
        this.password = password
        this.email = email
        this.rol = rol
        this.activo = activo
        this.ultimoAcceso = ultimoAcceso
    }

    esAdmin() { return this.rol === roles.ADMIN }

    registrarAcceso() { this.ultimoAcceso = new Date() }

    desactivar() { this.activo = false }
    activar() { this.activo = true}
}

module.exports = { Usuario, roles };
