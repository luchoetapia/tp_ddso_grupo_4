const bcrypt = require('bcrypt');
const crypto = require('crypto');
const AuthRepository = require('./authRepository');
const { usernameDesdeEmail } = require('./username');
const { UnauthorizedError, ForbiddenError, ConflictError } = require('../errors/AppError');

const MENSAJE_CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos';
// Intentos con sufijo numérico antes de rendirse al generar un username libre
const MAX_INTENTOS_USERNAME = 10;

class AuthService {
    constructor() { this.repositorio = new AuthRepository() }

    _encriptarPassword(password) { return bcrypt.hashSync(password, 10) }
    // Las cuentas creadas con LinkedIn no tienen password: nunca pasan el login con contraseña
    _verificarPassword(usuario, password) { return !!usuario.password && bcrypt.compareSync(password, usuario.password) }

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
        await this.verificarUsernameYEmail(username, email);

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
            throw err;
        }
    }

    async generarUsernameDisponible(email) {
        const base = usernameDesdeEmail(email);
        if (!(await this.repositorio.usernameEnUso(base))) return base;

        for (let intento = 0; intento < MAX_INTENTOS_USERNAME; intento++) {
            const candidato = `${base}${crypto.randomInt(1000, 10000)}`;
            if (!(await this.repositorio.usernameEnUso(candidato))) return candidato;
        }

        throw new ConflictError('No se pudo generar un nombre de usuario disponible');
    }

    async verificarUsernameYEmail(username, email) {
        const [usernameEnUso, emailEnUso] = await Promise.all([
            this.repositorio.usernameEnUso(username),
            this.repositorio.emailEnUso(email),
        ]);

        const enUso = [];
        if (usernameEnUso) enUso.push('Nombre de usuario')
        if (emailEnUso) enUso.push('Email')
        
        if (enUso.length)
            throw new ConflictError(enUso.length === 1
                ? `El campo ${enUso[0]} ya está en uso`
                : `Los campos ${enUso.join(' y ')} ya están en uso`
            )

        return true;
    }
}

module.exports = AuthService
