const crypto = require('crypto');

// Cifrado simétrico de los access tokens de LinkedIn antes de guardarlos en la base.
// AES-256-GCM: además de cifrar, detecta si el valor guardado fue alterado.
// Formato guardado: iv.authTag.cifrado (cada parte en base64url)
const ALGORITMO = 'aes-256-gcm';
const LARGO_IV = 12;

// La clave sale de LINKEDIN_TOKEN_KEY; se pasa por SHA-256 para tener siempre 32 bytes
const clave = () => {
    const secreto = process.env.LINKEDIN_TOKEN_KEY;
    if (!secreto) throw new Error('Falta la variable de entorno LINKEDIN_TOKEN_KEY');

    return crypto.createHash('sha256').update(secreto).digest();
};

const cifrar = (texto) => {
    const iv = crypto.randomBytes(LARGO_IV);
    const cifrador = crypto.createCipheriv(ALGORITMO, clave(), iv);
    const cifrado = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()]);

    return [iv, cifrador.getAuthTag(), cifrado].map((parte) => parte.toString('base64url')).join('.');
};

const descifrar = (guardado) => {
    const [iv, authTag, cifrado] = guardado.split('.').map((parte) => Buffer.from(parte, 'base64url'));

    const descifrador = crypto.createDecipheriv(ALGORITMO, clave(), iv);
    descifrador.setAuthTag(authTag);

    return Buffer.concat([descifrador.update(cifrado), descifrador.final()]).toString('utf8');
};

module.exports = { cifrar, descifrar };
