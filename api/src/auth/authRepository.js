const Usuario = require('./models/usuarioSchema')
const { NotFoundError } = require('../errors/AppError')

class AuthRepository {
    constructor() {}

    obtenerUsuarioPorUsername(username) { return Usuario.findOne({ username }); }

    obtenerUsuarioPorMail(email) { return Usuario.findOne({ email }); }

    crearUsuario(body) { return Usuario.create(body) }

    desactivarUsuario(id) { return this._actualizar(id, { activo: false }) }

    activarUsuario(id) { return this._actualizar(id, { activo: true }) }

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
