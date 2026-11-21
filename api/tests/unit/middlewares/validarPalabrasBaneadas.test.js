jest.mock('../../../src/repositories/palabraBaneadaRepository', () => ({
    listadoPalabrasBaneadas: jest.fn().mockResolvedValue(['tonto'])
}));

const validarPalabrasBaneadas = require('../../../src/middlewares/validarPalabrasBaneadas.js');
const { BadRequestError } = require('../../../src/errors/AppError.js');

describe('Middleware validarPalabrasBaneadas', () => {
    test('deja pasar un body sin palabras baneadas', async () => {
        const next = jest.fn();
        await validarPalabrasBaneadas()({ body: { titulo: 'Huerta comunitaria' } }, {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    test('rechaza con 400 si algún string tiene una palabra baneada (incluso anidado)', async () => {
        const req = { body: { titulo: 'Ok', perfiles: [{ descripcion: 'algo tonto' }] } };
        const error = await validarPalabrasBaneadas()(req, {}, jest.fn()).catch(e => e);

        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.statusCode).toBe(400);
        expect(error.details).toEqual({ palabras: ['tonto'] });
    });

    test('solo revisa los campos indicados', async () => {
        const next = jest.fn();
        const req = { body: { titulo: 'Ok', email: 'tonto@mail.com' } };
        await validarPalabrasBaneadas(['titulo'])(req, {}, next);
        expect(next).toHaveBeenCalled();
    });

    test('puede revisar otra parte del request', async () => {
        const req = { query: { busqueda: 'tonto' } };
        await expect(validarPalabrasBaneadas(null, 'query')(req, {}, jest.fn())).rejects.toBeInstanceOf(BadRequestError);
    });
});
