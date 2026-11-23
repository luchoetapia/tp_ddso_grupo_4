// Cuenta que administra un colectivo (titular o adicional). No incluye datos sensibles de la cuenta.
class AdministradorPublic {
    constructor(id, username, email, esTitular) {
        this.id = id
        this.username = username
        this.email = email
        this.esTitular = esTitular
    }

    static desde({ usuario, esTitular }) {
        return new AdministradorPublic(
            (usuario._id ?? usuario.id)?.toString(),
            usuario.username,
            usuario.email,
            esTitular
        )
    }
}

module.exports = { AdministradorPublic }
