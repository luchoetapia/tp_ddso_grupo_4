jest.mock('../../src/services/colectivoService.js', () => ({
    obtenerTodos: jest.fn(),
    crear: jest.fn(),
    obtenerPorId: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const colectivoService = require('../../src/services/colectivoService.js');
const { ConflictError, NotFoundError } = require('../../src/errors/AppError.js');

const ID = '507f1f77bcf86cd799439051';
const colectivo = { id: ID, nombre: 'Tech For Good', descripcion: 'desc', ubicacion: 'Córdoba', tipo: 'fundacion', proyectos: [] };

describe('Endpoints /colectivos', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('GET /colectivos', () => {
        test('devuelve la lista de colectivos', async () => {
            colectivoService.obtenerTodos.mockResolvedValue([colectivo]);

            const res = await request(app).get('/colectivos');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([colectivo]);
        });
    });

    describe('POST /colectivos', () => {
        test('crea el colectivo aplicando defaults del validador', async () => {
            colectivoService.crear.mockResolvedValue(colectivo);

            const res = await request(app).post('/colectivos').send({ nombre: 'Tech For Good', tipo: 'fundacion' });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: 'Colectivo creado exitosamente', data: colectivo });
            expect(colectivoService.crear).toHaveBeenCalledWith({ nombre: 'Tech For Good', tipo: 'fundacion', proyectos: [] });
        });

        test('responde 400 con un tipo inválido', async () => {
            const res = await request(app).post('/colectivos').send({ nombre: 'X', tipo: 'club' });

            expect(res.status).toBe(400);
            expect(colectivoService.crear).not.toHaveBeenCalled();
        });

        test('responde 400 con ids de proyectos inválidos', async () => {
            const res = await request(app).post('/colectivos').send({ nombre: 'X', tipo: 'ong', proyectos: ['123'] });

            expect(res.status).toBe(400);
        });

        test('responde 409 si ya existe', async () => {
            colectivoService.crear.mockRejectedValue(new ConflictError('Ya existe un colectivo con ese nombre'));

            const res = await request(app).post('/colectivos').send({ nombre: 'X', tipo: 'ong' });

            expect(res.status).toBe(409);
        });
    });

    describe('GET /colectivos/:id', () => {
        test('devuelve el colectivo', async () => {
            colectivoService.obtenerPorId.mockResolvedValue(colectivo);

            const res = await request(app).get(`/colectivos/${ID}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(colectivo);
        });

        test('responde 400 con un id inválido', async () => {
            const res = await request(app).get('/colectivos/abc');

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Id de colectivo inválido');
        });

        test('responde 404 si no existe', async () => {
            colectivoService.obtenerPorId.mockRejectedValue(new NotFoundError('Colectivo no encontrado'));

            const res = await request(app).get(`/colectivos/${ID}`);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /colectivos/llenarDatosPrueba', () => {
        test('crea los colectivos por defecto', async () => {
            colectivoService.crear.mockImplementation(async (datos) => ({ id: ID, ...datos }));

            const res = await request(app).post('/colectivos/llenarDatosPrueba');

            expect(res.status).toBe(201);
            expect(res.body.data.map(c => c.nombre)).toEqual(['Colectivo Software Libre', 'Tech For Good']);
        });

        test('responde 400 si algún elemento es inválido', async () => {
            const res = await request(app).post('/colectivos/llenarDatosPrueba').send([{ nombre: 'Sin tipo' }]);

            expect(res.status).toBe(400);
        });
    });
});
