const bcrypt = require('bcrypt');
const crypto = require('crypto');
const AuthRepository = require('./authRepository');
const { roles } = require('./models/usuario');
const { usernameDesdeEmail } = require('./username');
const { cifrar } = require('../linkedin/cifrado');
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

    // tokenLinkedin viene de linkedinService.canjearCodigo: { accessToken, expiraEn, scopes }.
    // Se guarda cifrado para poder publicar en nombre del usuario más adelante.
    async _guardarTokenLinkedin(usuario, tokenLinkedin) {
        if (!tokenLinkedin) return usuario;

        // Sin clave de cifrado configurada no se guarda el token: el ingreso sigue funcionando, solo no se puede publicar
        if (!process.env.LINKEDIN_TOKEN_KEY) {
            console.warn('[LinkedIn] Falta LINKEDIN_TOKEN_KEY: no se guarda el token y no se va a poder publicar');
            return usuario;
        }

        return this.repositorio.guardarTokenLinkedin(usuario.id, {
            tokenCifrado: cifrar(tokenLinkedin.accessToken),
            tokenExpiraEn: tokenLinkedin.expiraEn,
            scopes: tokenLinkedin.scopes,
        });
    }

    // Ingreso con LinkedIn (solo colaboradores). datosLinkedin viene de linkedinService.obtenerDatos:
    // { sub, email, emailVerificado, nombre, apellido, foto }
    //  1. Si ya hay un usuario vinculado a ese sub -> es un login.
    //  2. Si hay un colaborador con ese email -> se le vincula LinkedIn y entra.
    //  3. Si no -> se crea un colaborador sin password, con username generado desde el email.
    // nombre, apellido y foto se guardan solo al crear o vincular (no se actualizan en cada ingreso).
    async ingresarConLinkedin(datosLinkedin, tokenLinkedin = null) {
        const usuario = await this._ingresarConLinkedin(datosLinkedin);
        return this._guardarTokenLinkedin(usuario, tokenLinkedin);
    }

    async _ingresarConLinkedin(datosLinkedin) {
        const { sub, email, emailVerificado, nombre, apellido, foto } = datosLinkedin;

        // Sin email verificado no se puede confiar en que la persona sea dueña de ese email
        if (!emailVerificado)
            throw new ForbiddenError('Tu email de LinkedIn no está verificado. Verificalo en LinkedIn y volvé a intentar');

        const vinculado = await this.repositorio.obtenerUsuarioPorLinkedinSub(sub);
        if (vinculado) return vinculado;

        const linkedin = { sub, nombre, apellido, foto };
        const existente = await this.repositorio.obtenerUsuarioPorMail(email);

        if (existente) {
            if (existente.rol !== roles.COLABORADOR)
                throw new ForbiddenError('Solo los colaboradores pueden ingresar con LinkedIn');
            if (existente.tieneLinkedin())
                throw new ConflictError('Tu cuenta ya está vinculada a otra cuenta de LinkedIn');

            return this.repositorio.vincularLinkedin(existente.id, linkedin);
        }

        const username = await this.generarUsernameDisponible(email);
        return this.repositorio.crearUsuario({ username, email, rol: roles.COLABORADOR, linkedin });
    }

    // Vincular LinkedIn a un colaborador o colectivo que ya inició sesión (para poder publicar).
    // También sirve para reconectar: si ya estaba vinculado a esa misma cuenta, solo se renueva el token.
    // No exige email verificado: la identidad del usuario ya está probada por su sesión.
    async vincularLinkedin(usuarioId, datosLinkedin, tokenLinkedin) {
        const { sub, nombre, apellido, foto } = datosLinkedin;

        let usuario = await this.obtenerUsuarioActivo(usuarioId);
        if (![roles.COLABORADOR, roles.COLECTIVO].includes(usuario.rol))
            throw new ForbiddenError('Solo los colaboradores y los colectivos pueden vincular LinkedIn');

        const vinculado = await this.repositorio.obtenerUsuarioPorLinkedinSub(sub);
        if (vinculado && String(vinculado.id) !== String(usuario.id))
            throw new ConflictError('Esa cuenta de LinkedIn ya está vinculada a otro usuario');

        if (usuario.linkedin?.sub && usuario.linkedin.sub !== sub)
            throw new ConflictError('Tu cuenta ya está vinculada a otra cuenta de LinkedIn. Conectate con esa');

        if (!usuario.linkedin?.sub)
            usuario = await this.repositorio.vincularLinkedin(usuario.id, { sub, nombre, apellido, foto });

        return this._guardarTokenLinkedin(usuario, tokenLinkedin);
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
