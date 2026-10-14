import { BadRequestError } from "../helpers/api-erros.js";

const validar = (schema, part='body') => {
    return (req, _, next) => {
        const resultado = schema.validate(req[part]);

        if (!resultado.success) {
            const mensaje = resultado.error.details.map(e => e.message).join(', ');
            throw new BadRequestError(mensaje);
        }
    
        next();
    }
}

module.exports = validar;