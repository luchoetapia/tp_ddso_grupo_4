const LARGO_MINIMO_USERNAME = 3;

// "Juan.Pérez Gómez" -> "juan.perez-gomez" (minúsculas, sin tildes, solo a-z 0-9 . _ -)
const aUsername = (texto) => texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

// "Juan.Perez@gmail.com" -> "juan.perez".
// Si queda más corta que el mínimo del registro, se completa: "jp@x.com" -> "jp-usuario".
const usernameDesdeEmail = (email) => {
    const base = aUsername(email.split('@')[0]);

    if (base.length >= LARGO_MINIMO_USERNAME) return base;
    return base ? `${base}-usuario` : 'usuario';
};

module.exports = { aUsername, usernameDesdeEmail, LARGO_MINIMO_USERNAME };
