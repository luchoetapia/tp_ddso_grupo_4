jest.mock('../../src/repositories/proyectoRepository.js', () => ({
    estadisticasGlobales: jest.fn(),
    totalHabilidadesBuscadas: jest.fn(),
    proyectosDestacados: jest.fn()
}));

jest.mock('../../src/repositories/colectivoRepository.js', () => ({
    estadisticasGlobales: jest.fn()
}));

jest.mock('../../src/repositories/colaboracionRepository.js', () => ({
    estadisticasGlobales: jest.fn()
}));

const request = require('supertest');
const app = require('../../src/app.js');
const proyectoRepository =
    require('../../src/repositories/proyectoRepository.js');
const colectivoRepository =
    require('../../src/repositories/colectivoRepository.js');
const colaboracionRepository =
    require('../../src/repositories/colaboracionRepository.js');

describe('GET /home/contadores', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => jest.restoreAllMocks());

    beforeEach(() => {
        jest.clearAllMocks();

        proyectoRepository.estadisticasGlobales.mockResolvedValue({
            total: 12,
            activos: 7,
            finalizados: 5
        });

        proyectoRepository.totalHabilidadesBuscadas.mockResolvedValue(9);

        colectivoRepository.estadisticasGlobales.mockResolvedValue({
            total: 6,
            activos: 5,
            desactivados: 1
        });

        colaboracionRepository.estadisticasGlobales.mockResolvedValue({
            colaboracionesTotales: 25,
            colaboracionesActivas: 18,
            colaboracionesFinalizadas: 7,
            colaboradores: 15
        });
    });

    test('responde 200 sin autenticación', async () => {
        const res = await request(app).get('/home/contadores');

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            proyectosTotales: 12,
            proyectosActivos: 7,
            proyectosFinalizados: 5,
            colectivosTotales: 6,
            colaboradores: 15,
            colaboracionesTotales: 25,
            colaboracionesActivas: 18
        });
    });
});