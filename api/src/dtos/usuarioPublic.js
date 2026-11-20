class UsuarioPublic {
    // linkedin: { nombre, apellido, foto } si la cuenta está vinculada a LinkedIn (sin el sub), o null.
    // El front lo usa para precargar el formulario de completar perfil.
    constructor(id, username, email, rol, linkedin = null) {
        this.id = id
        this.username = username
        this.email = email
        this.rol = rol
        this.linkedin = linkedin
    }

    static desde(usuario) {
        const { linkedin } = usuario

        return new UsuarioPublic(
            usuario.id,
            usuario.username,
            usuario.email,
            usuario.rol,
            linkedin?.sub
                ? { nombre: linkedin.nombre ?? null, apellido: linkedin.apellido ?? null, foto: linkedin.foto ?? null }
                : null
        )
    }
}

module.exports = { UsuarioPublic }
