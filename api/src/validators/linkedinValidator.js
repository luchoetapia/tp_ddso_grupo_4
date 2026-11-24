const { z } = require('zod');
const { objectId } = require('./comunes.js');
const { MAX_CARACTERES_POST } = require('../linkedin/linkedinService.js');

const validarPublicacionLinkedin = z.object({
    proyectoId: objectId('Id de proyecto inválido'),
    texto: z.string({ error: 'El texto es obligatorio' })
        .trim()
        .min(1, 'El texto no puede estar vacío')
        .max(MAX_CARACTERES_POST, `El texto puede tener hasta ${MAX_CARACTERES_POST} caracteres`),
}).strict();

const validarPublicacionLogroLinkedin = validarPublicacionLinkedin.extend({
    logroId: objectId('Id de logro inválido'),
});

module.exports = { validarPublicacionLinkedin, validarPublicacionLogroLinkedin };
