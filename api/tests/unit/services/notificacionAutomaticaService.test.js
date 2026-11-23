jest.mock('../../../src/repositories/colaboradorRepository.js', () => ({
    findByCondition: jest.fn(),
}));
jest.mock('../../../src/repositories/proyectoRepository.js', () => ({
    findAbiertosCumplibles: jest.fn(),
}));
jest.mock('../../../src/repositories/notificacionRepository.js', () => ({
    save: jest.fn(),
}));
jest.mock('../../../src/models/Notificacion.js', () => ({
    obtenerNotificador: jest.fn(),
}));

const colaboradorRepository = require('../../../src/repositories/colaboradorRepository.js');
const notificacionRepository = require('../../../src/repositories/notificacionRepository.js');
const notificacionAutomaticaService = require('../../../src/services/notificacionAutomaticaService.js');

describe('NotificacionAutomaticaService', () => {
    beforeEach(() => jest.resetAllMocks());

    test('no crea ni envía una notificación a una cuenta inactiva', async () => {
        const colaborador = {
            id: 'colaborador-1',
            usuario: { activo: false },
            deseaSerContactado: true,
            habilidades: [],
            contactos: [],
        };
        colaboradorRepository.findByCondition.mockResolvedValue([colaborador]);

        const enviadas = await notificacionAutomaticaService.notificarColaboradoresCompatibles(
            {
                id: 'proyecto-1',
                finalizado: false,
                perfiles: [{ estaAbierto: () => true, habilidadesRequeridas: [], id: 'perfil-1' }],
            },
            [{ estaAbierto: () => true, habilidadesRequeridas: [], id: 'perfil-1' }]
        );

        expect(enviadas).toBe(0);
        expect(notificacionRepository.save).not.toHaveBeenCalled();
    });
});