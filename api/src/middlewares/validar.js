const { BadRequestError } = require('../errors/AppError.js');

const validar = (schema, part='body') => {
    return (req, _, next) => {
        const resultado = schema.safeParse(req[part]);

        if (!resultado.success) {
            const mensaje = resultado.error.issues.map(e => e.message).join(', ');
            throw new BadRequestError(mensaje, resultado.error.issues);
        }

        if (part === 'body') req.body = resultado.data;
        // En Express 5 req.query es un getter de solo lectura: se redefine en el request para dejar
        // los datos parseados (con defaults y números ya convertidos, ej. pagina/limite)
        if (part === 'query') Object.defineProperty(req, 'query', { value: resultado.data, writable: true, enumerable: true });

        next();
    }
}

module.exports = validar;
