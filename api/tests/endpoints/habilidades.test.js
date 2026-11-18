jest.mock('../../src/services/habilidadService.js', () => ({
    obtenerTodas: jest.fn(),
    crear: jest.fn(),
    obtenerPorId: jest.fn(),
}));

const request = require('supertest');
const { roles } = require('../../src/auth/models/usuario.js');
const { cookieDeSesion, ID_USUARIO } = require('../helpers/sesion.js');
const app = require('../../src/app.js');
const habilidadService = require('../../src/services/habilidadService.js');
const { ConflictError, NotFoundError } = require('../../src/errors/AppError.js');

const ID = '507f1f77bcf86cd799439021';
const habilidad = { id: ID, titulo: 'JavaScript', tipoHabilidad: 'programacion', descripcion: 'Lenguaje' };

// Resultado paginado como lo devuelven los services
const paginaDe = (habilidades, extra = {}) => ({ habilidades, total: habilidades.length, pagina: 1, limite: 10, totalPaginas: 1, ...extra });
const paginacionDefault = { pagina: 1, limite: 10 };

describe('Endpoints /habilidades', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('GET /habilidades', () => {
        test('devuelve la lista de habilidades', async () => {
            habilidadService.obtenerTodas.mockResolvedValue(paginaDe([habilidad]));

            const res = await request(app).get('/habilidades');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: [habilidad], paginacion: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 } });
            expect(habilidadService.obtenerTodas).toHaveBeenCalledWith(paginacionDefault);
        });

        test('responde 400 con una página inválida', async () => {
            const res = await request(app).get('/habilidades?pagina=-1');

            expect(res.status).toBe(400);
            expect(habilidadService.obtenerTodas).not.toHaveBeenCalled();
        });
    });

    describe('POST /habilidades', () => {
        const body = { titulo: 'JavaScript', tipoHabilidad: 'programacion', descripcion: 'Lenguaje' };

        test('responde 401 sin sesión', async () => {
            const res = await request(app).post('/habilidades').send(body);

            expect(res.status).toBe(401);
            expect(habilidadService.crear).not.toHaveBeenCalled();
        });

        test('responde 403 si no es del equipo administrativo', async () => {
            const res = await request(app).post('/habilidades').set('Cookie', cookieDeSesion(roles.COLECTIVO)).send(body);

            expect(res.status).toBe(403);
            expect(habilidadService.crear).not.toHaveBeenCalled();
        });

        test('crea la habilidad', async () => {
            habilidadService.crear.mockResolvedValue(habilidad);

            const res = await request(app).post('/habilidades').set('Cookie', cookieDeSesion(roles.ADMIN)).send(body);

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: 'Habilidad creada exitosamente', data: habilidad });
            expect(habilidadService.crear).toHaveBeenCalledWith(body);
        });

        test('responde 400 si el body es inválido', async () => {
            const res = await request(app).post('/habilidades').set('Cookie', cookieDeSesion(roles.ADMIN)).send({ titulo: 'JS', tipoHabilidad: 'cocina' });

            expect(res.status).toBe(400);
            expect(res.body.details.length).toBeGreaterThan(0);
            expect(habilidadService.crear).not.toHaveBeenCalled();
        });

        test('responde 400 si se envían campos de más', async () => {
            const res = await request(app).post('/habilidades').set('Cookie', cookieDeSesion(roles.ADMIN)).send({ ...body, extra: true });

            expect(res.status).toBe(400);
        });

        test('responde 409 si ya existe', async () => {
            habilidadService.crear.mockRejectedValue(new ConflictError('Ya existe una habilidad con ese título'));

            const res = await request(app).post('/habilidades').set('Cookie', cookieDeSesion(roles.ADMIN)).send(body);

            expect(res.status).toBe(409);
            expect(res.body.message).toBe('Ya existe una habilidad con ese título');
        });
    });

    describe('GET /habilidades/:id', () => {
        test('devuelve la habilidad', async () => {
            habilidadService.obtenerPorId.mockResolvedValue(habilidad);

            const res = await request(app).get(`/habilidades/${ID}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(habilidad);
            expect(habilidadService.obtenerPorId).toHaveBeenCalledWith(ID);
        });

        test('responde 400 con un id inválido', async () => {
            const res = await request(app).get('/habilidades/123');

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Id de habilidad inválido');
        });

        test('responde 404 si no existe', async () => {
            habilidadService.obtenerPorId.mockRejectedValue(new NotFoundError('Habilidad no encontrada'));

            const res = await request(app).get(`/habilidades/${ID}`);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /habilidades/llenarDatosPrueba', () => {
        test('crea las habilidades por defecto si no se envía body', async () => {
            habilidadService.crear.mockImplementation(async (datos) => ({ id: ID, ...datos }));

            const res = await request(app).post('/habilidades/llenarDatosPrueba').set('Cookie', cookieDeSesion(roles.ADMIN));

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.map(h => h.titulo)).toEqual(['JavaScript', 'Node.js']);
        });

        test('crea las habilidades enviadas en el body', async () => {
            habilidadService.crear.mockImplementation(async (datos) => ({ id: ID, ...datos }));

            const res = await request(app).post('/habilidades/llenarDatosPrueba').set('Cookie', cookieDeSesion(roles.ADMIN))
                .send([{ titulo: 'Figma', tipoHabilidad: 'diseño', descripcion: 'Diseño UI' }]);

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveLength(1);
        });

        test('responde 400 si algún elemento es inválido', async () => {
            const res = await request(app).post('/habilidades/llenarDatosPrueba').set('Cookie', cookieDeSesion(roles.ADMIN)).send([{ titulo: 'x' }]);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Datos inválidos');
        });
    });
});
