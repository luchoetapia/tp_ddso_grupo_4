const crypto = require('crypto');
const AuthService = require('./authService');

let authService;

// "Juan.Pérez Gómez" -> "juan.perez-gomez" (minúsculas, sin tildes, solo a-z 0-9 . _ -)
const aUsername = (texto) => texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Crea el usuario que acompaña a un dato de prueba (colectivo o colaborador).
// username: derivado del nombre (o la cuenta de Git); email: <username>@semilla.local.
// password: SEED_PASSWORD del .env; si no está definida es aleatoria (el usuario existe pero no se puede loguear).
const crearUsuarioDeSemilla = async (nombreBase, rol) => {
    authService ??= new AuthService();

    const username = aUsername(nombreBase);
    const password = process.env.SEED_PASSWORD || crypto.randomBytes(16).toString('hex');

    return authService.registrarUsuario(username, password, `${username}@semilla.local`, rol);
};

module.exports = { crearUsuarioDeSemilla, aUsername };
