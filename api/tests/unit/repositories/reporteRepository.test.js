const ReporteModel = require('../../../src/database/schemas/reporteSchema.js');
const reporteRepository = require('../../../src/repositories/reporteRepository.js');
const { EstadoReporte } = require('../../../src/models/Reporte.js');

const ID = '507f1f77bcf86cd799439041';

describe('Reporte schema', () => {
    test('arranca pendiente, sin dueño ni revisión, y limpia el motivo', async () => {
        const reporte = new ReporteModel({ entidad: { tipo: 'Proyecto', id: ID }, motivo: '  algo  ' });

        await expect(reporte.validate()).resolves.toBeUndefined();
        expect(reporte).toMatchObject({ estado: 'Pendiente', motivo: 'algo', duenio: null, revisadoPor: null, notificado: false, fechaNotificacion: null });
        expect(reporte.estaPendiente()).toBe(true);
    });

    test('exige motivo y un tipo de entidad válido', async () => {
        const reporte = new ReporteModel({ entidad: { tipo: 'Habilidad', id: ID } });

        const error = await reporte.validate().catch(e => e);
        expect(Object.keys(error.errors)).toEqual(expect.arrayContaining(['motivo', 'entidad.tipo']));
    });
});

describe('ReporteRepository.resolver', () => {
    test('solo actualiza si el reporte sigue pendiente', async () => {
        const populate = jest.fn().mockResolvedValue('resuelto');
        const spy = jest.spyOn(ReporteModel, 'findOneAndUpdate').mockReturnValue({ populate });

        await expect(reporteRepository.resolver(ID, EstadoReporte.VALIDADO, 'admin', 'ok')).resolves.toBe('resuelto');
        expect(spy).toHaveBeenCalledWith(
            { _id: ID, estado: EstadoReporte.PENDIENTE },
            expect.objectContaining({ estado: EstadoReporte.VALIDADO, revisadoPor: 'admin', comentarioRevision: 'ok', fechaRevision: expect.any(Date) }),
            { new: true }
        );

        spy.mockRestore();
    });
});

describe('ReporteRepository.marcarNotificado', () => {
    test('solo marca reportes pendientes y no cambia el estado', async () => {
        const populate = jest.fn().mockResolvedValue('notificado');
        const spy = jest.spyOn(ReporteModel, 'findOneAndUpdate').mockReturnValue({ populate });

        await reporteRepository.marcarNotificado(ID);

        expect(spy).toHaveBeenCalledWith(
            { _id: ID, estado: EstadoReporte.PENDIENTE },
            { notificado: true, fechaNotificacion: expect.any(Date) },
            { new: true }
        );

        spy.mockRestore();
    });
});

describe('ReporteRepository.solucionarNotificados', () => {
    test('solo pasa a solucionado los pendientes notificados de la entidad', async () => {
        const spy = jest.spyOn(ReporteModel, 'updateMany').mockResolvedValue({ modifiedCount: 1 });

        await expect(reporteRepository.solucionarNotificados(ID)).resolves.toBe(1);
        expect(spy).toHaveBeenCalledWith(
            { 'entidad.id': ID, estado: EstadoReporte.PENDIENTE, notificado: true },
            { estado: EstadoReporte.SOLUCIONADO, fechaSolucion: expect.any(Date) }
        );

        spy.mockRestore();
    });
});
