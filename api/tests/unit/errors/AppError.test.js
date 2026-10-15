const { AppError, BadRequestError, NotFoundError, ConflictError } = require('../../../src/errors/AppError.js');

describe('AppError', () => {
    test('guarda mensaje, status y detalles', () => {
        const error = new AppError('Falló', 418, ['detalle']);

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Falló');
        expect(error.statusCode).toBe(418);
        expect(error.details).toEqual(['detalle']);
        expect(error.name).toBe('AppError');
    });

    test.each([
        [BadRequestError, 400, 'BadRequestError'],
        [NotFoundError, 404, 'NotFoundError'],
        [ConflictError, 409, 'ConflictError'],
    ])('%p tiene el status code correcto', (Clase, statusCode, nombre) => {
        const error = new Clase('mensaje', ['d']);

        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(statusCode);
        expect(error.name).toBe(nombre);
        expect(error.message).toBe('mensaje');
        expect(error.details).toEqual(['d']);
    });
});
