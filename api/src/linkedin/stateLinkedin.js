const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// El "state" de OAuth viaja en una cookie httpOnly con sameSite 'lax' (ver authController).
// Además del valor aleatorio contra CSRF lleva qué se estaba haciendo, firmado para que no se pueda alterar:
//   { state, modo: 'ingreso' | 'vincular', usuarioId?, volverA?, publicar? }
// Hace falta porque las cookies de sesión son sameSite 'strict' y no llegan al callback (que viene navegando
// desde linkedin.com): para vincular, el usuario que inició el flujo se toma de acá.
const MODOS = { INGRESO: 'ingreso', VINCULAR: 'vincular' };
const AUDIENCIA = 'linkedin-state';
const DURACION = '10m';

const clave = () => process.env.JWT_ACCESS_KEY;

const crear = (datos) => {
    const state = crypto.randomBytes(32).toString('hex');
    const cookie = jwt.sign({ ...datos, state }, clave(), { audience: AUDIENCIA, expiresIn: DURACION });
    return { state, cookie };
};

// Payload de la cookie si la firma es válida y no venció; si no, null
const leer = (cookie) => {
    if (!cookie) return null;
    try {
        return jwt.verify(cookie, clave(), { audience: AUDIENCIA });
    } catch {
        return null;
    }
};

// El state que volvió de LinkedIn es el mismo que se guardó en la cookie.
// Comparación en tiempo constante (no revela por timing cuántos caracteres coinciden)
const coincide = (payload, stateRecibido) => {
    if (!payload?.state || typeof stateRecibido !== 'string') return false;

    const a = Buffer.from(stateRecibido);
    const b = Buffer.from(payload.state);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = { crear, leer, coincide, MODOS };
