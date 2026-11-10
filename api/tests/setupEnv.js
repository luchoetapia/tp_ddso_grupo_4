// Claves JWT por defecto para los tests (app.js crea el AuthController al importarse y exige las keys)
process.env.JWT_ACCESS_KEY ??= 'clave-access-test';
process.env.JWT_REFRESH_KEY ??= 'clave-refresh-test';
