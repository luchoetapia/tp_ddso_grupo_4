jest.mock('../../src/services/colaboracionService.js', () => ({
    obtenerTodas: jest.fn(),
    crear: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const colaboracionService = require('../../src/services/colaboracionService.js');
const { ConflictError, NotFoundError } = require('../../src/errors/AppError.js');

const ID_PROY = '507f1f77bcf86cd799439041';
const ID_COLAB = '507f1f77bcf86cd799439011';
const colaboracion = {
    id: '507f1f77bcf86cd799439061', colaborador: ID_COLAB, proyecto: ID_PROY,
    inicio: '2024-01-01T00:00:00.000Z', fin: null, esAnonima: false,
};

describe('Endpoints /colaboraciones', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('GET /colaboraciones', () => {
        test('devuelve la lista de colaboraciones', async () => {
            colaboracionService.obtenerTodas.mockResolvedValue([colaboracion]);

            const res = await request(app).get('/colaboraciones');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([colaboracion]);
        });
    });

    describe('POST /colaboraciones', () => {
        const body = { idProyecto: ID_PROY, idColaborador: ID_COLAB };

        test('crea la colaboración', async () => {
            colaboracionService.crear.mockResolvedValue(colaboracion);

            const res = await request(app).post('/colaboraciones').send(body);

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: 'Colaboracion creada exitosamente', data: colaboracion });
            expect(colaboracionService.crear).toHaveBeenCalledWith(body);
        });

        test('responde 400 con ids inválidos', async () => {
            const res = await request(app).post('/colaboraciones').send({ idProyecto: '1', idColaborador: ID_COLAB });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Id de proyecto inválido');
            expect(colaboracionService.crear).not.toHaveBeenCalled();
        });

        test('responde 400 sin body', async () => {
            const res = await request(app).post('/colaboraciones');

            expect(res.status).toBe(400);
        });

        test('responde 404 si el proyecto no existe', async () => {
            colaboracionService.crear.mockRejectedValue(new NotFoundError('Proyecto no encontrado'));

            const res = await request(app).post('/colaboraciones').send(body);

            expect(res.status).toBe(404);
        });

        test('responde 409 si el proyecto está finalizado', async () => {
            colaboracionService.crear.mockRejectedValue(new ConflictError('El proyecto ya fue finalizado'));

            const res = await request(app).post('/colaboraciones').send(body);

            expect(res.status).toBe(409);
            expect(res.body.message).toBe('El proyecto ya fue finalizado');
        });
    });
});
