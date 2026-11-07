const bcrypt = require('bcrypt');

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

    encriptarPassword() { this.password = bcrypt.hashSync(this.password, 10) }
    verificarPassword(password) { return bcrypt.compareSync(password, this.password); }
}

module.exports = { Usuario, roles };
