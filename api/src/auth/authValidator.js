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

module.exports = {
    validarLogin,
    validarRegistro
};
