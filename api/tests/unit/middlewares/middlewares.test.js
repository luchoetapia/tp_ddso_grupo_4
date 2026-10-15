const { z } = require('zod');
const validar = require('../../../src/middlewares/validar.js');
const { errorHandler, obtenerStatusCode } = require('../../../src/middlewares/errorHandler.js');
const { errorLogger } = require('../../../src/middlewares/errorLogger.js');
const { notFoundHandler } = require('../../../src/middlewares/notFoundHandler.js');
const { requestLogger } = require('../../../src/middlewares/requestLogger.js');
const { BadRequestError, NotFoundError, ConflictError } = require('../../../src/errors/AppError.js');

const crearRes = () => {
    const res = { headersSent: false, listeners: {} };
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    res.on = jest.fn((evento, callback) => { res.listeners[evento] = callback; });
    return res;
};

describe('Middlewares', () => {
    describe('validar', () => {
        const schema = z.object({ nombre: z.string({ error: 'nombre requerido' }), edad: z.number().default(18) });

        test('reemplaza el body con los datos parseados y sigue', () => {
            const req = { body: { nombre: 'Ana' } };
            const next = jest.fn();

            validar(schema)(req, {}, next);

            expect(req.body).toEqual({ nombre: 'Ana', edad: 18 });
            expect(next).toHaveBeenCalledWith();
        });

        test('valida params sin modificarlos', () => {
            const req = { params: { nombre: 'Ana' } };
            const next = jest.fn();

            validar(schema, 'params')(req, {}, next);

            expect(req.params).toEqual({ nombre: 'Ana' });
            expect(next).toHaveBeenCalled();
        });

        test('lanza BadRequestError con los mensajes de error', () => {
            const req = { body: {} };
            const next = jest.fn();

            expect(() => validar(schema)(req, {}, next)).toThrow(BadRequestError);
            expect(() => validar(schema)(req, {}, next)).toThrow('nombre requerido');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('obtenerStatusCode', () => {
        test.each([
            [new BadRequestError('x'), 400],
            [new NotFoundError('x'), 404],
            [new ConflictError('x'), 409],
            [Object.assign(new Error('x'), { name: 'ValidationError' }), 400],
            [Object.assign(new Error('x'), { name: 'CastError' }), 400],
            [new Error('x'), 500],
        ])('%p => %i', (error, esperado) => {
            expect(obtenerStatusCode(error)).toBe(esperado);
        });
    });

    describe('errorHandler', () => {
        test('responde con status, mensaje y detalles', () => {
            const res = crearRes();

            errorHandler(new ConflictError('Ya existe', ['d']), {}, res, jest.fn());

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: 'Ya existe', details: ['d'] });
        });

        test('usa valores por defecto para errores sin mensaje ni detalles', () => {
            const res = crearRes();

            errorHandler(new Error(), {}, res, jest.fn());

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error interno del servidor', details: [] });
        });

        test('delega en next si ya se enviaron headers', () => {
            const res = crearRes();
            res.headersSent = true;
            const next = jest.fn();
            const error = new Error('x');

            errorHandler(error, {}, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('errorLogger', () => {
        let consoleError;
        beforeEach(() => { consoleError = jest.spyOn(console, 'error').mockImplementation(() => {}); });
        afterEach(() => consoleError.mockRestore());

        test('loguea errores de cliente sin stack y sigue con el error', () => {
            const next = jest.fn();
            const error = new NotFoundError('No está');

            errorLogger(error, { method: 'GET', originalUrl: '/x' }, {}, next);

            const linea = consoleError.mock.calls[0][0];
            expect(linea).toContain('GET /x | 404 | NotFoundError: No está');
            expect(linea).not.toContain(error.stack);
            expect(next).toHaveBeenCalledWith(error);
        });

        test('incluye el stack en errores de servidor', () => {
            const error = new Error('Explotó');

            errorLogger(error, { method: 'POST', originalUrl: '/y' }, {}, jest.fn());

            expect(consoleError.mock.calls[0][0]).toContain(error.stack);
        });
    });

    describe('notFoundHandler', () => {
        test('pasa un NotFoundError con la ruta', () => {
            const next = jest.fn();

            notFoundHandler({ originalUrl: '/inexistente' }, {}, next);

            const error = next.mock.calls[0][0];
            expect(error).toBeInstanceOf(NotFoundError);
            expect(error.message).toBe('Ruta /inexistente no encontrada');
        });
    });

    describe('requestLogger', () => {
        let consoleLog;
        beforeEach(() => { consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {}); });
        afterEach(() => consoleLog.mockRestore());

        const ejecutar = (statusCode, body) => {
            const res = crearRes();
            const next = jest.fn();
            requestLogger({ method: 'GET', originalUrl: '/z' }, res, next);
            res.statusCode = statusCode;
            if (body) res.json(body);
            res.listeners.finish();
            return next;
        };

        test('loguea respuestas exitosas incluyendo el message del body', () => {
            const next = ejecutar(201, { message: 'Creado' });

            expect(next).toHaveBeenCalled();
            expect(consoleLog.mock.calls[0][0]).toContain('GET /z | 201 | Creado');
        });

        test('loguea sin message si el body no lo tiene', () => {
            ejecutar(200);

            expect(consoleLog.mock.calls[0][0]).toContain('GET /z | 200');
            expect(consoleLog.mock.calls[0][0]).not.toContain('| undefined');
        });

        test('no loguea errores (los maneja errorLogger)', () => {
            ejecutar(404, { message: 'No' });

            expect(consoleLog).not.toHaveBeenCalled();
        });
    });
});
