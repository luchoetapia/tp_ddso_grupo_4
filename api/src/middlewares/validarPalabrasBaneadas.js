const palabraBaneadaService = require('../services/palabraBaneadaSevice.js');
const { BadRequestError } = require('../errors/AppError.js');

// Junta todos los strings de un valor, recorriendo objetos y arrays anidados
const extraerTextos = (valor) => {
    if (typeof valor === 'string') return [valor];
    if (Array.isArray(valor)) return valor.flatMap(extraerTextos);
    if (valor && typeof valor === 'object') return Object.values(valor).flatMap(extraerTextos);
    return [];
};

// campos: lista de campos a revisar. Si no se pasa, revisa todos los strings.
const validarPalabrasBaneadas = (campos, part = 'body') => {
    return async (req, _, next) => {
        const datos = req[part] ?? {};
        const valores = campos ? campos.map(campo => datos[campo]) : [datos];
        const texto = valores.flatMap(extraerTextos).join(' ');

        const encontradas = await palabraBaneadaService.detectar(texto);

        if (encontradas.length > 0)
            throw new BadRequestError('El contenido tiene palabras no permitidas', { palabras: encontradas });

        next();
    };
};

module.exports = validarPalabrasBaneadas;
