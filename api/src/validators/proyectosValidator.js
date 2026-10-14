const { z } = require('zod');

const validarIdsProyecto = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Id de proyecto inválido"),
});

module.exports = {
    validarIdsProyecto
}
