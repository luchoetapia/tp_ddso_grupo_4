jest.mock('../../src/services/habilidadService.js', () => ({
    obtenerTodas: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const habilidadService = require('../../src/services/habilidadService.js');

describe('Endpoints generales', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    test('GET / responde el saludo', async () => {
        const res = await request(app).get('/');

        expect(res.status).toBe(200);
        expect(res.text).toBe('¡Hola Mundo!');
    });

    test('GET /healthcheck responde ok con timestamp', async () => {
        const res = await request(app).get('/healthcheck');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
    });

    test('una ruta inexistente responde 404', async () => {
        const res = await request(app).get('/no-existe');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ message: 'Ruta /no-existe no encontrada', details: [] });
    });

    test('un método no soportado en una ruta existente responde 404', async () => {
        const res = await request(app).delete('/habilidades');

        expect(res.status).toBe(404);
    });

    test('un JSON mal formado responde 400', async () => {
        const res = await request(app)
            .post('/habilidades')
            .set('Content-Type', 'application/json')
            .send('{"titulo": ');

        expect(res.status).toBe(400);
    });

    test('un error inesperado responde 500 con el mensaje', async () => {
        habilidadService.obtenerTodas.mockRejectedValue(new Error('Se cayó la base'));

        const res = await request(app).get('/habilidades');

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: 'Se cayó la base', details: [] });
    });

    test('GET /api-documentation/ sirve la documentación de Swagger', async () => {
        const res = await request(app).get('/api-documentation/');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/html/);
    });
});
