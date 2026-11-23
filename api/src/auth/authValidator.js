const { z } = require('zod');
const { roles } = require('../auth/models/usuario.js');

// Por el registro público solo se pueden crear colaboradores o colectivos, nunca admins
const rolesRegistrables = [roles.COLABORADOR, roles.COLECTIVO];

const validarLogin = z.object({
    // accessKey puede ser el username o el email
    accessKey: z.string({ error: "El username o email es obligatorio" }).trim().min(1, "El username o email no puede estar vacío"),
    password: z.string({ error: "La contraseña es obligatoria" }).min(1, "La contraseña no puede estar vacía"),
}).strict();

const validarRegistro = z.object({
    username: z.string({ error: "El username es obligatorio" }).trim().min(3, "El username debe tener al menos 3 caracteres"),
    password: z.string({ error: "La contraseña es obligatoria" }).min(8, "La contraseña debe tener al menos 8 caracteres"),
    email: z.email({ error: "El email es obligatorio y debe tener un formato válido" }),
    rol: z.enum(rolesRegistrables, { error: `El rol debe ser uno de: ${rolesRegistrables.join(', ')}` }),
}).strict();

// Mismas reglas que el registro para username y email (llegan por query string)
const validarDisponibilidad = validarRegistro.pick({ username: true, email: true });

// Query con la que LinkedIn vuelve al callback cuando el usuario aceptó.
// (Si canceló, en lugar de code llega error=user_cancelled_login o user_cancelled_authorize.)
// No se usa con el middleware validar: el callback es una navegación del navegador y los errores se informan redirigiendo.
const validarCallbackLinkedin = z.object({
    code: z.string().min(1),
    state: z.string().min(1),
});

// Ruta del front a la que se vuelve después de vincular LinkedIn: tiene que ser interna
// (empieza con una sola "/", sin "\\") para que no se pueda usar para redirigir a otro sitio
const rutaInterna = z.string().max(300).regex(/^\/(?![\/\\])[^\\]*$/);

// Query de GET /auth/linkedin/vincular
const validarVincularLinkedin = z.object({
    volverA: rutaInterna.optional(),
    // id del proyecto sobre el que se quería publicar (el front reabre el modal al volver)
    publicar: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

module.exports = {
    validarLogin,
    validarRegistro,
    validarDisponibilidad,
    validarCallbackLinkedin,
    validarVincularLinkedin
};
