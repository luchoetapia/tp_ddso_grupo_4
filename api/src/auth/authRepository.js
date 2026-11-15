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

    crearUsuario(body) { return Usuario.create(body) }

    desactivarUsuario(id) { return this._actualizar(id, { activo: false }) }

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
