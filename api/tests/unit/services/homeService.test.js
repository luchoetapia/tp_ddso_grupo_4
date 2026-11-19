jest.mock('../../../src/repositories/proyectoRepository.js', () => ({
    estadisticasGlobales: jest.fn(),
    totalHabilidadesBuscadas: jest.fn(),
    rankingHabilidades: jest.fn()
}));

jest.mock('../../../src/repositories/colectivoRepository.js', () => ({
    estadisticasGlobales: jest.fn()
}));

jest.mock('../../../src/repositories/colaboracionRepository.js', () => ({
    estadisticasGlobales: jest.fn()
}));

const proyectoRepository = require('../../../src/repositories/proyectoRepository.js');
const colectivoRepository = require('../../../src/repositories/colectivoRepository.js');
const colaboracionRepository = require('../../../src/repositories/colaboracionRepository.js');
const homeService = require('../../../src/services/homeService.js');

describe('HomeService', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('devuelve las estadísticas globales combinadas', async () => {
        proyectoRepository.estadisticasGlobales.mockResolvedValue({
            total: 12,
            activos: 7,
            finalizados: 5
        });

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

        proyectoRepository.totalHabilidadesBuscadas.mockResolvedValue(9);

        await expect(homeService.contadores()).resolves.toEqual({
            totalColectivos: 5,
            proyectosActivos: 7,
            colaboradores: 15,
            habilidadesBuscadas: 9,
            proyectosTotales: 12,
            proyectosFinalizados: 5,
            colectivosTotales: 6,
            colectivosActivos: 5,
            colectivosDesactivados: 1,
            colaboracionesTotales: 25,
            colaboracionesActivas: 18,
            colaboracionesFinalizadas: 7
        });
    });

    test('usa TOP_HABILIDADES al solicitar el ranking', async () => {
        await homeService.rankingHabilidades();

        expect(proyectoRepository.rankingHabilidades)
            .toHaveBeenCalledWith(5);
    });
});