jest.mock('../../../src/repositories/reporteRepository.js', () => ({
    save: jest.fn(),
    findById: jest.fn(),
    buscarConPaginacion: jest.fn(),
    resolver: jest.fn(),
    marcarNotificado: jest.fn(),
    solucionarNotificados: jest.fn(),
    eliminarEntidad: jest.fn(),
    existeEntidad: jest.fn()
}));

jest.mock('../../../src/repositories/colectivoRepository.js', () => ({
    findById: jest.fn(),
    findBy: jest.fn()
}));

const reporteRepository = require('../../../src/repositories/reporteRepository.js');
const colectivoRepository = require('../../../src/repositories/colectivoRepository.js');
const reporteService = require('../../../src/services/reporteService.js');
const { Reporte, EstadoReporte, TipoEntidadReportada } = require('../../../src/models/Reporte.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_ENTIDAD = '507f1f77bcf86cd799439041';
const ID_REPORTE = '507f1f77bcf86cd799439091';
const ID_USUARIO = '507f1f77bcf86cd799439011';
const ID_ADMIN = '507f1f77bcf86cd799439099';

const reporteCon = (estado) => Object.assign(new Reporte({ tipo: 'Proyecto', id: ID_ENTIDAD }, 'motivo'), { estado });

describe('ReporteService', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        reporteRepository.existeEntidad.mockResolvedValue(true);
        reporteRepository.save.mockImplementation(async (datos) => datos);
    });

    describe('crear', () => {
        test('guarda el reporte con el dueño del colectivo dueño del proyecto', async () => {
            colectivoRepository.findBy.mockResolvedValue([{ usuario: ID_USUARIO }]);

            const reporte = await reporteService.crear({ tipoEntidad: TipoEntidadReportada.PROYECTO, idEntidad: ID_ENTIDAD, motivo: '  Contenido ofensivo ' });

            expect(colectivoRepository.findBy).toHaveBeenCalledWith({ proyectos: ID_ENTIDAD });
            expect(reporte).toEqual({ entidad: { tipo: 'Proyecto', id: ID_ENTIDAD }, motivo: 'Contenido ofensivo', duenio: ID_USUARIO });
        });

        test('el dueño de un colectivo es su usuario', async () => {
            colectivoRepository.findById.mockResolvedValue({ usuario: ID_USUARIO });

            const reporte = await reporteService.crear({ tipoEntidad: TipoEntidadReportada.COLECTIVO, idEntidad: ID_ENTIDAD, motivo: 'x' });

            expect(reporte.duenio).toBe(ID_USUARIO);
        });

        test.each([TipoEntidadReportada.COLABORADOR, TipoEntidadReportada.POSTULACION])('%s no lleva dueño', async (tipo) => {
            const reporte = await reporteService.crear({ tipoEntidad: tipo, idEntidad: ID_ENTIDAD, motivo: 'x' });

            expect(reporte.duenio).toBeNull();
            expect(colectivoRepository.findById).not.toHaveBeenCalled();
            expect(colectivoRepository.findBy).not.toHaveBeenCalled();
        });

        test('proyecto sin colectivo queda sin dueño', async () => {
            colectivoRepository.findBy.mockResolvedValue([]);

            const reporte = await reporteService.crear({ tipoEntidad: TipoEntidadReportada.PROYECTO, idEntidad: ID_ENTIDAD, motivo: 'x' });

            expect(reporte.duenio).toBeNull();
        });

        test.each([
            [{ tipoEntidad: 'Habilidad', idEntidad: ID_ENTIDAD, motivo: 'x' }],
            [{ tipoEntidad: 'Proyecto', idEntidad: 'no-es-id', motivo: 'x' }],
            [{ tipoEntidad: 'Proyecto', idEntidad: ID_ENTIDAD, motivo: '   ' }]
        ])('rechaza datos inválidos %#', async (datos) => {
            await expect(reporteService.crear(datos)).rejects.toBeInstanceOf(BadRequestError);
            expect(reporteRepository.save).not.toHaveBeenCalled();
        });

        test('404 si la entidad no existe', async () => {
            reporteRepository.existeEntidad.mockResolvedValue(false);

            await expect(reporteService.crear({ tipoEntidad: 'Colaborador', idEntidad: ID_ENTIDAD, motivo: 'x' }))
                .rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe('obtenerPorId', () => {
        test('400 con id inválido y 404 si no existe', async () => {
            await expect(reporteService.obtenerPorId('abc')).rejects.toBeInstanceOf(BadRequestError);

            reporteRepository.findById.mockResolvedValue(null);
            await expect(reporteService.obtenerPorId(ID_REPORTE)).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe('listar', () => {
        test('arma los filtros por estado y tipo de entidad', async () => {
            await reporteService.listar({ pagina: 2, limite: 5, estado: EstadoReporte.PENDIENTE, tipoEntidad: 'Proyecto' });

            expect(reporteRepository.buscarConPaginacion).toHaveBeenCalledWith(2, 5, { estado: 'Pendiente', 'entidad.tipo': 'Proyecto' });
        });

        test('sin filtros lista todo', async () => {
            await reporteService.listar();

            expect(reporteRepository.buscarConPaginacion).toHaveBeenCalledWith(1, 10, {});
        });
    });

    describe('rechazar', () => {
        test('solo cambia el estado, no toca la entidad', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.PENDIENTE));
            reporteRepository.resolver.mockResolvedValue({ estado: EstadoReporte.RECHAZADO });

            const resultado = await reporteService.rechazar(ID_REPORTE, ID_ADMIN, 'negro como color');

            expect(reporteRepository.resolver).toHaveBeenCalledWith(ID_REPORTE, EstadoReporte.RECHAZADO, ID_ADMIN, 'negro como color');
            expect(reporteRepository.eliminarEntidad).not.toHaveBeenCalled();
            expect(resultado.estado).toBe(EstadoReporte.RECHAZADO);
        });

        test('409 si el reporte ya estaba resuelto', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.VALIDADO));

            await expect(reporteService.rechazar(ID_REPORTE, ID_ADMIN)).rejects.toBeInstanceOf(ConflictError);
            expect(reporteRepository.resolver).not.toHaveBeenCalled();
        });

        test('409 si otro admin lo resolvió entre la lectura y la actualización', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.PENDIENTE));
            reporteRepository.resolver.mockResolvedValue(null);

            await expect(reporteService.rechazar(ID_REPORTE, ID_ADMIN)).rejects.toBeInstanceOf(ConflictError);
        });
    });

    describe('validar', () => {
        test('elimina la entidad y deja el reporte validado', async () => {
            const reporte = reporteCon(EstadoReporte.PENDIENTE);
            reporte.entidad.id = { _id: ID_ENTIDAD, titulo: 'Proyecto populado' };
            reporteRepository.findById.mockResolvedValue(reporte);
            reporteRepository.resolver.mockResolvedValue({ estado: EstadoReporte.VALIDADO });

            const resultado = await reporteService.validar(ID_REPORTE, ID_ADMIN, 'ofensivo');

            expect(reporteRepository.eliminarEntidad).toHaveBeenCalledWith('Proyecto', ID_ENTIDAD);
            expect(reporteRepository.resolver).toHaveBeenCalledWith(ID_REPORTE, EstadoReporte.VALIDADO, ID_ADMIN, 'ofensivo');
            expect(resultado.estado).toBe(EstadoReporte.VALIDADO);
        });

        test('si la entidad ya no existe igual valida el reporte', async () => {
            const reporte = reporteCon(EstadoReporte.PENDIENTE);
            reporte.entidad.id = null;
            reporteRepository.findById.mockResolvedValue(reporte);
            reporteRepository.resolver.mockResolvedValue({ estado: EstadoReporte.VALIDADO });

            await reporteService.validar(ID_REPORTE, ID_ADMIN);

            expect(reporteRepository.eliminarEntidad).not.toHaveBeenCalled();
            expect(reporteRepository.resolver).toHaveBeenCalled();
        });

        test('409 sin eliminar nada si el reporte ya estaba resuelto', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.RECHAZADO));

            await expect(reporteService.validar(ID_REPORTE, ID_ADMIN)).rejects.toBeInstanceOf(ConflictError);
            expect(reporteRepository.eliminarEntidad).not.toHaveBeenCalled();
        });
    });

    describe('notificar', () => {
        test('marca notificado y el reporte sigue pendiente', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.PENDIENTE));
            reporteRepository.marcarNotificado.mockResolvedValue({ estado: EstadoReporte.PENDIENTE, notificado: true });

            const resultado = await reporteService.notificar(ID_REPORTE);

            expect(reporteRepository.marcarNotificado).toHaveBeenCalledWith(ID_REPORTE);
            expect(reporteRepository.resolver).not.toHaveBeenCalled();
            expect(resultado).toMatchObject({ estado: EstadoReporte.PENDIENTE, notificado: true });
        });

        test('409 si el reporte ya estaba resuelto', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.VALIDADO));

            await expect(reporteService.notificar(ID_REPORTE)).rejects.toBeInstanceOf(ConflictError);
            expect(reporteRepository.marcarNotificado).not.toHaveBeenCalled();
        });

        test('409 si lo resolvieron entre la lectura y la actualización', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.PENDIENTE));
            reporteRepository.marcarNotificado.mockResolvedValue(null);

            await expect(reporteService.notificar(ID_REPORTE)).rejects.toBeInstanceOf(ConflictError);
        });
    });

    describe('solucionarPorEntidad', () => {
        test('soluciona los reportes notificados de la entidad editada', async () => {
            reporteRepository.solucionarNotificados.mockResolvedValue(2);

            await expect(reporteService.solucionarPorEntidad(ID_ENTIDAD)).resolves.toBe(2);
            expect(reporteRepository.solucionarNotificados).toHaveBeenCalledWith(ID_ENTIDAD);
        });
    });
});
