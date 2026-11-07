class UsuarioPublic {
    constructor(id, username, email, rol) {
        this.id = id
        this.username = username
        this.email = email
        this.rol = rol
    }

    static desde(usuario) {
        return new UsuarioPublic(
            usuario.id,
            usuario.username,
            usuario.email,
            usuario.rol
        )
    }
}

module.exports = { UsuarioPublic }
