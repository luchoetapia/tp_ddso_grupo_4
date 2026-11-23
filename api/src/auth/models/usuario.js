const roles = {
    ADMIN: 'admin',
    COLABORADOR: 'colaborador',
    COLECTIVO: 'colectivo'
}

const SCOPE_PUBLICAR_LINKEDIN = 'w_member_social'

// Hay token guardado, no venció y LinkedIn otorgó el permiso para publicar.
// Función suelta (además del método) porque también se usa con objetos planos (DTO, tests).
const puedePublicarEnLinkedin = (linkedin) =>
    !!linkedin?.sub &&
    !!linkedin.tokenExpiraEn &&
    new Date(linkedin.tokenExpiraEn) > new Date() &&
    (linkedin.scopes ?? []).includes(SCOPE_PUBLICAR_LINKEDIN)

class Usuario {
    // linkedin: { sub, nombre, apellido, foto, tokenCifrado, tokenExpiraEn, scopes } si la cuenta se creó o vinculó con LinkedIn.
    // tokenCifrado es el access token de LinkedIn cifrado (no se lee por defecto: select false).
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

    puedePublicarEnLinkedin() { return puedePublicarEnLinkedin(this.linkedin) }

    registrarAcceso() { this.ultimoAcceso = new Date() }

    desactivar() { this.activo = false }
}

module.exports = { Usuario, roles, puedePublicarEnLinkedin, SCOPE_PUBLICAR_LINKEDIN };
