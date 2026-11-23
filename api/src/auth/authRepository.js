const Usuario = require('./models/usuarioSchema')
const { NotFoundError } = require('../errors/AppError')

class AuthRepository {
    constructor() {}

    // Una cuenta desactivada libera su username y email, así que puede haber varias
    // inactivas con el mismo valor pero a lo sumo una activa: siempre buscamos la activa.
    obtenerUsuarioPorUsername(username) { return Usuario.findOne({ username, activo: true }); }

    obtenerUsuarioPorMail(email) { return Usuario.findOne({ email, activo: true }); }

    async usernameEnUso(username) { return !!(await Usuario.exists({ username, activo: true })); }

    async emailEnUso(email) { return !!(await Usuario.exists({ email, activo: true })); }

    obtenerUsuarioPorId(id) { return Usuario.findById(id); }

    obtenerUsuarioPorLinkedinSub(sub) { return Usuario.findOne({ 'linkedin.sub': sub, activo: true }); }

    vincularLinkedin(id, linkedin) { return this._actualizar(id, { linkedin }) }

    // token: { tokenCifrado, tokenExpiraEn, scopes }
    guardarTokenLinkedin(id, token) {
        return this._actualizar(id, {
            'linkedin.tokenCifrado': token.tokenCifrado,
            'linkedin.tokenExpiraEn': token.tokenExpiraEn,
            'linkedin.scopes': token.scopes,
        })
    }

    // Usuario activo con el token cifrado incluido (el resto de las consultas no lo traen)
    obtenerUsuarioConTokenLinkedin(id) {
        return Usuario.findOne({ _id: id, activo: true }).select('+linkedin.tokenCifrado');
    }

    // Se usa cuando LinkedIn rechaza el token (vencido o revocado): el usuario conserva el vínculo pero tiene que reconectar
    async borrarTokenLinkedin(id) {
        await Usuario.updateOne(
            { _id: id },
            { $unset: { 'linkedin.tokenCifrado': 1, 'linkedin.tokenExpiraEn': 1, 'linkedin.scopes': 1 } }
        );
    }

    crearUsuario(body) { return Usuario.create(body) }

    async desactivarUsuario(id) {
        const usuario = await Usuario.findById(id);
        if (!usuario) throw new NotFoundError(`No existe el usuario con id ${id}`);

        // El user y mail se liberan al desactivar la cuenta
        // El perfil de colaborador y sus habilidades se conservan para el historial
        usuario.activo = false;
        usuario.username = `eliminado-${id}`;
        usuario.email = `eliminado-${id}@usuario.invalid`;
        usuario.password = null;
        usuario.linkedin = undefined;
        await usuario.save();

        return usuario;
    }

    modificarRol(id, nuevoRol) { return this._actualizar(id, { rol: nuevoRol }) }

    async _actualizar(id, cambios) {
        const usuario = await Usuario.findOneAndUpdate(
            { _id: id },
            { $set: cambios },
            { new: true, runValidators: true }
        )
        if (!usuario) throw new NotFoundError(`No existe el usuario con id ${id}`)
        return usuario
    }
}

module.exports = AuthRepository
