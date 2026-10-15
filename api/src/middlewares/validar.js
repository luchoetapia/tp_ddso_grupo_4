const { BadRequestError } = require('../errors/AppError.js');

const validar = (schema, part='body') => {
    return (req, _, next) => {
        const resultado = schema.safeParse(req[part]);

        if (!resultado.success) {
            const mensaje = resultado.error.issues.map(e => e.message).join(', ');
            throw new BadRequestError(mensaje, resultado.error.issues);
        }

        if (part === 'body') req.body = resultado.data;

        next();
    }
}

module.exports = validar;
