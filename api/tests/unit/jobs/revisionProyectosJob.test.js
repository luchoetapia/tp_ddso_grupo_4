jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../../../src/services/proyectoService.js', () => ({
    marcarProyectosSinActualizaciones: jest.fn(),
}));

const cron = require('node-cron');
const proyectoService = require('../../../src/services/proyectoService.js');
const {
    iniciarRevisionProyectosJob,
    marcarProyectosSinActualizaciones,
    EXPRESION_CRON,
    ZONA_HORARIA,
} = require('../../../src/jobs/revisionProyectosJob.js');

describe('revisionProyectosJob', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('se programa todos los días a las 00:00 en hora de Argentina', () => {
        iniciarRevisionProyectosJob();

        expect(EXPRESION_CRON).toBe('0 0 * * *');
        expect(ZONA_HORARIA).toBe('America/Argentina/Buenos_Aires');
        expect(cron.schedule).toHaveBeenCalledWith(
            '0 0 * * *',
            marcarProyectosSinActualizaciones,
            expect.objectContaining({ timezone: 'America/Argentina/Buenos_Aires' })
        );
    });

    test('al ejecutarse marca los proyectos sin actualizaciones y devuelve cuántos marcó', async () => {
        proyectoService.marcarProyectosSinActualizaciones.mockResolvedValue({ modifiedCount: 3 });

        const marcados = await marcarProyectosSinActualizaciones();

        expect(proyectoService.marcarProyectosSinActualizaciones).toHaveBeenCalledTimes(1);
        expect(marcados).toBe(3);
    });

    test('si falla no propaga el error (el servidor sigue andando)', async () => {
        proyectoService.marcarProyectosSinActualizaciones.mockRejectedValue(new Error('Mongo caído'));

        await expect(marcarProyectosSinActualizaciones()).resolves.toBe(0);
        expect(console.error).toHaveBeenCalled();
    });
});
