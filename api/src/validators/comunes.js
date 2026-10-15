const { z } = require('zod');

const objectId = (mensaje) => z.string({ error: mensaje }).regex(/^[0-9a-fA-F]{24}$/, mensaje);

const alMenosUnCampo = [(data) => Object.keys(data).length > 0, "Debe enviarse al menos un campo para actualizar"];

module.exports = {
    objectId,
    alMenosUnCampo,
};
