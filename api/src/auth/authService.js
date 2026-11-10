const bcrypt = require('bcrypt');
const AuthRepository = require('./authRepository');
const { UnauthorizedError, ForbiddenError, ConflictError } = require('../errors/AppError');

const MENSAJE_CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos';

class AuthService {
    constructor() { this.repositorio = new AuthRepository() }

    _encriptarPassword(password) { return bcrypt.hashSync(password, 10) }
    _verificarPassword(usuario, password) { return bcrypt.compareSync(password, usuario.password) }

    async verificarUsuario(accessKey, password) {
        // Valida si es un email con un regex que chequea el formato: algo@otracosa.ext
        const esEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accessKey);

        const usuario = esEmail
            ? await this.repositorio.obtenerUsuarioPorMail(accessKey)
            : await this.repositorio.obtenerUsuarioPorUsername(accessKey);

        // Mismo mensaje para usuario inexistente y contraseña incorrecta, para no revelar qué usuarios existen
        if (!usuario || !this._verificarPassword(usuario, password)) 
            throw new UnauthorizedError(MENSAJE_CREDENCIALES_INVALIDAS);
        if (!usuario.activo) throw new ForbiddenError('El usuario está desactivado');

        return usuario;
    }

    // Devuelve el usuario si existe y está activo (se usa al renovar la sesión y en /auth/me).
    // Si el usuario ya no existe o fue desactivado, la sesión deja de ser válida.
    async obtenerUsuarioActivo(id) {
        const usuario = await this.repositorio.obtenerUsuarioPorId(id);

        if (!usuario) throw new UnauthorizedError('La sesión ya no es válida');
        if (!usuario.activo) throw new ForbiddenError('El usuario está desactivado');

        return usuario;
    }

    async registrarUsuario(username, password, email, rol, activo = true) {
        const body = {
            username,
            password: this._encriptarPassword(password),
            email,
            rol,
            activo
        };

        try {
            return await this.repositorio.crearUsuario(body)
        } catch (err) {
            if (err.code === 11000) {
                const campo = Object.keys(err.keyPattern)[0];   // 'username' o 'email'
                throw new ConflictError(`El ${campo} ya está en uso`);
            }

            throw err;
        }
    }
}

module.exports = AuthService
