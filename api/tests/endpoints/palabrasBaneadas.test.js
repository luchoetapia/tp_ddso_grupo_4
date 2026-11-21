jest.mock('../../src/services/palabraBaneadaSevice.js', () => ({
    listar: jest.fn(),
    agregar: jest.fn(),
    activar: jest.fn(),
    desactivar: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const palabraBaneadaService = require('../../src/services/palabraBaneadaSevice.js');
const { ConflictError, NotFoundError } = require('../../src/errors/AppError.js');
const { cookieDeSesion } = require('../helpers/sesion.js');

const ID = '507f1f77bcf86cd799439061';
const FECHA = '2026-11-20T00:00:00.000Z';
const palabra = { id: ID, palabra: 'tonto', activa: true, createdAt: FECHA };
const palabraPublica = { id: ID, palabra: 'tonto', activa: true, fechaCreacion: FECHA };
const admin = cookieDeSesion('admin');

describe('Endpoints /palabrasBaneadas', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('autorización', () => {
        test.each([
            ['get', '/palabrasBaneadas'],
            ['post', '/palabrasBaneadas'],
            ['patch', `/palabrasBaneadas/${ID}/activar`],
            ['patch', `/palabrasBaneadas/${ID}/desactivar`],
        ])('%s %s responde 401 sin sesión y 403 si no es admin', async (metodo, ruta) => {
            expect((await request(app)[metodo](ruta)).status).toBe(401);
            expect((await request(app)[metodo](ruta).set('Cookie', cookieDeSesion('colectivo'))).status).toBe(403);
        });
    });

    describe('GET /palabrasBaneadas', () => {
        test('devuelve la página de palabras', async () => {
            palabraBaneadaService.listar.mockResolvedValue({ palabras: [palabra], total: 1, pagina: 1, limite: 10, totalPaginas: 1 });

            const res = await request(app).get('/palabrasBaneadas').set('Cookie', admin);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: [palabraPublica], paginacion: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 } });
            expect(palabraBaneadaService.listar).toHaveBeenCalledWith({ pagina: 1, limite: 10, activa: undefined });
        });

        test('filtra por activa', async () => {
            palabraBaneadaService.listar.mockResolvedValue({ palabras: [], total: 0, pagina: 2, limite: 5, totalPaginas: 0 });

            await request(app).get('/palabrasBaneadas?pagina=2&limite=5&activa=false').set('Cookie', admin);

            expect(palabraBaneadaService.listar).toHaveBeenCalledWith({ pagina: 2, limite: 5, activa: false });
        });

        test('responde 400 con un valor de activa inválido', async () => {
            const res = await request(app).get('/palabrasBaneadas?activa=si').set('Cookie', admin);

            expect(res.status).toBe(400);
            expect(palabraBaneadaService.listar).not.toHaveBeenCalled();
        });
    });

    describe('POST /palabrasBaneadas', () => {
        test('agrega la palabra', async () => {
            palabraBaneadaService.agregar.mockResolvedValue(palabra);

            const res = await request(app).post('/palabrasBaneadas').set('Cookie', admin).send({ palabra: '  tonto ' });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: 'Palabra baneada agregada exitosamente', data: palabraPublica });
            expect(palabraBaneadaService.agregar).toHaveBeenCalledWith('tonto');
        });

        test.each([[{}], [{ palabra: '   ' }], [{ palabra: 'x', extra: 1 }]])('responde 400 con body inválido %#', async (body) => {
            const res = await request(app).post('/palabrasBaneadas').set('Cookie', admin).send(body);

            expect(res.status).toBe(400);
            expect(palabraBaneadaService.agregar).not.toHaveBeenCalled();
        });

        test('responde 409 si ya existe', async () => {
            palabraBaneadaService.agregar.mockRejectedValue(new ConflictError("La palabra 'tonto' ya existe"));

            const res = await request(app).post('/palabrasBaneadas').set('Cookie', admin).send({ palabra: 'tonto' });

            expect(res.status).toBe(409);
        });
    });

    describe.each([
        ['activar', 'activar'],
        ['desactivar', 'desactivar'],
    ])('PATCH /palabrasBaneadas/:id/%s', (ruta, metodo) => {
        test('devuelve la palabra actualizada', async () => {
            palabraBaneadaService[metodo].mockResolvedValue(palabra);

            const res = await request(app).patch(`/palabrasBaneadas/${ID}/${ruta}`).set('Cookie', admin);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(palabraPublica);
            expect(palabraBaneadaService[metodo]).toHaveBeenCalledWith(ID);
        });

        test('responde 400 con id inválido', async () => {
            const res = await request(app).patch(`/palabrasBaneadas/abc/${ruta}`).set('Cookie', admin);

            expect(res.status).toBe(400);
            expect(palabraBaneadaService[metodo]).not.toHaveBeenCalled();
        });

        test('responde 404 si no existe', async () => {
            palabraBaneadaService[metodo].mockRejectedValue(new NotFoundError('Palabra baneada no encontrada'));

            const res = await request(app).patch(`/palabrasBaneadas/${ID}/${ruta}`).set('Cookie', admin);

            expect(res.status).toBe(404);
        });
    });
});
