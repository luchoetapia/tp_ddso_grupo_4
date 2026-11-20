const roles = {
    ADMIN: 'admin',
    COLABORADOR: 'colaborador',
    COLECTIVO: 'colectivo'
}

class Usuario {
    // linkedin: { sub, nombre, apellido, foto } si la cuenta se creó o vinculó con LinkedIn.
    // Las cuentas creadas con LinkedIn no tienen password (password = null).
    constructor(id, username, password, email, rol, activo = true, ultimoAcceso = new Date(), linkedin = null) {
        this.id = id
        this.username = username
        this.password = password
        this.email = email
        this.rol = rol
        this.activo = activo
        this.ultimoAcceso = ultimoAcceso
        this.linkedin = linkedin
    }

    esAdmin() { return this.rol === roles.ADMIN }

    tienePassword() { return !!this.password }

    tieneLinkedin() { return !!this.linkedin?.sub }

    registrarAcceso() { this.ultimoAcceso = new Date() }

    desactivar() { this.activo = false }
}

module.exports = { Usuario, roles };
