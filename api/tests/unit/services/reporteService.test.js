jest.mock('../../../src/repositories/reporteRepository.js', () => ({
    save: jest.fn(),
    findById: jest.fn(),
    buscarConPaginacion: jest.fn(),
    resolver: jest.fn(),
    marcarNotificado: jest.fn(),
    solucionarNotificados: jest.fn(),
    solucionarPendientes: jest.fn(),
    actualizarPendiente: jest.fn(),
    buscarNotificadosPendientesDe: jest.fn(),
    eliminarEntidad: jest.fn(),
    existeEntidad: jest.fn(),
    buscarEntidad: jest.fn(),
    existePendiente: jest.fn()
}));

jest.mock('../../../src/services/palabraBaneadaSevice.js', () => ({
    detectarEnCampos: jest.fn()
}));

jest.mock('../../../src/repositories/colectivoRepository.js', () => ({
    findById: jest.fn(),
    findBy: jest.fn()
}));

jest.mock('../../../src/repositories/colaboradorRepository.js', () => ({
    findById: jest.fn()
}));

jest.mock('../../../src/repositories/postulacionRepository.js', () => ({
    findById: jest.fn()
}));

const reporteRepository = require('../../../src/repositories/reporteRepository.js');
const colectivoRepository = require('../../../src/repositories/colectivoRepository.js');
const colaboradorRepository = require('../../../src/repositories/colaboradorRepository.js');
const postulacionRepository = require('../../../src/repositories/postulacionRepository.js');
const palabraBaneadaService = require('../../../src/services/palabraBaneadaSevice.js');
const reporteService = require('../../../src/services/reporteService.js');
const { Reporte, EstadoReporte, TipoEntidadReportada } = require('../../../src/models/Reporte.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_ENTIDAD = '507f1f77bcf86cd799439041';
const ID_REPORTE = '507f1f77bcf86cd799439091';
const ID_USUARIO = '507f1f77bcf86cd799439011';
const ID_ADMIN = '507f1f77bcf86cd799439099';
const ID_COLAB = '507f1f77bcf86cd799439012';

const reporteCon = (estado) => Object.assign(new Reporte({ tipo: 'Proyecto', id: ID_ENTIDAD }, 'motivo'), { estado });

describe('ReporteService', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        reporteRepository.existeEntidad.mockResolvedValue(true);
        reporteRepository.save.mockImplementation(async (datos) => datos);
        // Los avisos a administradores se envían en segundo plano: no se toca la base real
        reporteService.authRepository = { obtenerAdministradoresActivos: jest.fn().mockResolvedValue([]) };
    });

    describe('crear', () => {
        test('guarda el reporte con el dueño del colectivo dueño del proyecto', async () => {
            colectivoRepository.findBy.mockResolvedValue([{ usuario: ID_USUARIO }]);

            const reporte = await reporteService.crear({ tipoEntidad: TipoEntidadReportada.PROYECTO, idEntidad: ID_ENTIDAD, motivo: '  Contenido ofensivo ' });

            expect(colectivoRepository.findBy).toHaveBeenCalledWith({ proyectos: ID_ENTIDAD });
            expect(reporte).toEqual({ entidad: { tipo: 'Proyecto', id: ID_ENTIDAD }, motivo: 'Contenido ofensivo', reglas: [], duenio: ID_USUARIO });
        });

        test('el dueño de un colectivo es su usuario', async () => {
            colectivoRepository.findById.mockResolvedValue({ usuario: ID_USUARIO });

            const reporte = await reporteService.crear({ tipoEntidad: TipoEntidadReportada.COLECTIVO, idEntidad: ID_ENTIDAD, motivo: 'x' });

            expect(reporte.duenio).toBe(ID_USUARIO);
        });

        test('el dueño de un colaborador es su usuario', async () => {
            colaboradorRepository.findById.mockResolvedValue({ usuario: ID_USUARIO });

            const reporte = await reporteService.crear({ tipoEntidad: TipoEntidadReportada.COLABORADOR, idEntidad: ID_ENTIDAD, motivo: 'x' });

            expect(colaboradorRepository.findById).toHaveBeenCalledWith(ID_ENTIDAD);
            expect(reporte.duenio).toBe(ID_USUARIO);
        });

        test('el dueño de una postulación es el usuario de la colaboradora que postuló', async () => {
            postulacionRepository.findById.mockResolvedValue({ colaborador: ID_COLAB });
            colaboradorRepository.findById.mockResolvedValue({ usuario: ID_USUARIO });

            const reporte = await reporteService.crear({ tipoEntidad: TipoEntidadReportada.POSTULACION, idEntidad: ID_ENTIDAD, motivo: 'x' });

            expect(colaboradorRepository.findById).toHaveBeenCalledWith(ID_COLAB);
            expect(reporte.duenio).toBe(ID_USUARIO);
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

    describe('obtenerDetalle', () => {
        test('devuelve el reporte con los textos actuales de la entidad', async () => {
            const reporte = reporteCon(EstadoReporte.PENDIENTE);
            reporteRepository.findById.mockResolvedValue(reporte);
            reporteRepository.buscarEntidad.mockResolvedValue({ titulo: 'T', descripcion: 'D', perfiles: [], logros: [], finalizado: false });

            const detalle = await reporteService.obtenerDetalle(ID_REPORTE);

            expect(reporteRepository.buscarEntidad).toHaveBeenCalledWith('Proyecto', ID_ENTIDAD);
            expect(detalle).toEqual({ reporte, contenido: { titulo: 'T', descripcion: 'D' } });
        });

        test('contenido null si la entidad fue eliminada', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.VALIDADO));
            reporteRepository.buscarEntidad.mockResolvedValue(null);

            await expect(reporteService.obtenerDetalle(ID_REPORTE)).resolves.toMatchObject({ contenido: null });
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
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.PENDIENTE));
            reporteRepository.resolver.mockResolvedValue({ estado: EstadoReporte.VALIDADO });

            const resultado = await reporteService.validar(ID_REPORTE, ID_ADMIN, 'ofensivo');

            expect(reporteRepository.eliminarEntidad).toHaveBeenCalledWith('Proyecto', ID_ENTIDAD);
            expect(reporteRepository.resolver).toHaveBeenCalledWith(ID_REPORTE, EstadoReporte.VALIDADO, ID_ADMIN, 'ofensivo');
            expect(resultado.estado).toBe(EstadoReporte.VALIDADO);
        });

        test('si la entidad ya no existe igual valida el reporte', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.PENDIENTE));
            reporteRepository.eliminarEntidad.mockResolvedValue(null);
            reporteRepository.resolver.mockResolvedValue({ estado: EstadoReporte.VALIDADO });

            await expect(reporteService.validar(ID_REPORTE, ID_ADMIN)).resolves.toEqual({ estado: EstadoReporte.VALIDADO });
        });

        test('409 sin eliminar nada si el reporte ya estaba resuelto', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.RECHAZADO));

            await expect(reporteService.validar(ID_REPORTE, ID_ADMIN)).rejects.toBeInstanceOf(ConflictError);
            expect(reporteRepository.eliminarEntidad).not.toHaveBeenCalled();
        });
    });

    describe('notificar', () => {
        const conDuenio = (estado) => Object.assign(reporteCon(estado), { duenio: ID_USUARIO });

        test('marca notificado y el reporte sigue pendiente', async () => {
            reporteRepository.findById.mockResolvedValue(conDuenio(EstadoReporte.PENDIENTE));
            reporteRepository.marcarNotificado.mockResolvedValue({ estado: EstadoReporte.PENDIENTE, notificado: true });

            const resultado = await reporteService.notificar(ID_REPORTE);

            expect(reporteRepository.marcarNotificado).toHaveBeenCalledWith(ID_REPORTE, undefined);
            expect(reporteRepository.resolver).not.toHaveBeenCalled();
            expect(resultado).toMatchObject({ estado: EstadoReporte.PENDIENTE, notificado: true });
        });

        test('busca el dueño si es un reporte viejo que no lo tenía', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.PENDIENTE));
            colectivoRepository.findBy.mockResolvedValue([{ usuario: ID_USUARIO }]);
            reporteRepository.marcarNotificado.mockResolvedValue({ estado: EstadoReporte.PENDIENTE, notificado: true });

            await reporteService.notificar(ID_REPORTE);

            expect(reporteRepository.marcarNotificado).toHaveBeenCalledWith(ID_REPORTE, ID_USUARIO);
        });

        test('409 si el reporte ya estaba resuelto', async () => {
            reporteRepository.findById.mockResolvedValue(reporteCon(EstadoReporte.VALIDADO));

            await expect(reporteService.notificar(ID_REPORTE)).rejects.toBeInstanceOf(ConflictError);
            expect(reporteRepository.marcarNotificado).not.toHaveBeenCalled();
        });

        test('409 si lo resolvieron entre la lectura y la actualización', async () => {
            reporteRepository.findById.mockResolvedValue(conDuenio(EstadoReporte.PENDIENTE));
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

    describe('revisarPalabrasBaneadas', () => {
        const proyecto = {
            id: ID_ENTIDAD,
            titulo: 'Proyecto',
            descripcion: 'desc',
            perfiles: [{ titulo: 'Back', descripcion: 'perfil' }],
            logros: [{ titulo: 'Logro', descripcion: 'logro' }]
        };

        beforeEach(() => {
            reporteRepository.solucionarPendientes.mockResolvedValue([]);
        });

        test('revisa todos los textos del proyecto, incluidos perfiles y logros', async () => {
            palabraBaneadaService.detectarEnCampos.mockResolvedValue({});

            await reporteService.revisarPalabrasBaneadas('Proyecto', proyecto);

            expect(palabraBaneadaService.detectarEnCampos).toHaveBeenCalledWith({
                titulo: 'Proyecto',
                descripcion: 'desc',
                'perfiles[0].titulo': 'Back',
                'perfiles[0].descripcion': 'perfil',
                'logros[0].titulo': 'Logro',
                'logros[0].descripcion': 'logro'
            });
        });

        test('si está limpio soluciona los reportes pendientes y no crea uno', async () => {
            palabraBaneadaService.detectarEnCampos.mockResolvedValue({});

            await expect(reporteService.revisarPalabrasBaneadas('Proyecto', proyecto)).resolves.toBeNull();

            expect(reporteRepository.solucionarPendientes).toHaveBeenCalledWith(ID_ENTIDAD);
            expect(reporteRepository.save).not.toHaveBeenCalled();
        });

        test('con palabras prohibidas crea un reporte con el detalle y el dueño', async () => {
            palabraBaneadaService.detectarEnCampos.mockResolvedValue({ descripcion: ['tonto'], 'perfiles[0].titulo': ['feo', 'tonto'] });
            reporteRepository.existePendiente.mockResolvedValue(false);
            colectivoRepository.findBy.mockResolvedValue([{ usuario: ID_USUARIO }]);

            const reporte = await reporteService.revisarPalabrasBaneadas('Proyecto', proyecto);

            expect(reporte).toEqual({
                entidad: { tipo: 'Proyecto', id: ID_ENTIDAD },
                motivo: 'Palabras prohibidas detectadas en: descripcion (tonto); perfiles[0].titulo (feo, tonto)',
                reglas: ['palabras_prohibidas'],
                duenio: ID_USUARIO
            });
            expect(reporteRepository.solucionarPendientes).not.toHaveBeenCalled();
        });

        test('no duplica: si ya hay un reporte pendiente de la entidad, lo actualiza', async () => {
            palabraBaneadaService.detectarEnCampos.mockResolvedValue({ titulo: ['tonto'] });
            reporteRepository.existePendiente.mockResolvedValue(true);
            const actualizado = { id: ID_REPORTE, entidad: { tipo: 'Proyecto', id: ID_ENTIDAD } };
            reporteRepository.actualizarPendiente.mockResolvedValue(actualizado);

            const resultado = await reporteService.revisarPalabrasBaneadas('Proyecto', proyecto);

            expect(resultado).toEqual(actualizado);
            expect(reporteRepository.actualizarPendiente).toHaveBeenCalledWith(
                ID_ENTIDAD, 'Palabras prohibidas detectadas en: titulo (tonto)', ['palabras_prohibidas']
            );
            expect(reporteRepository.save).not.toHaveBeenCalled();
        });

        test.each([
            ['Colectivo', { _id: ID_ENTIDAD, nombre: 'n', descripcion: 'd', ubicacion: 'u', tipo: 'fundacion' }, { nombre: 'n', descripcion: 'd', ubicacion: 'u' }],
            ['Colaborador', { _id: ID_ENTIDAD, nombre: 'n', apellido: 'a', nombreFantasia: null, pronombres: 'p', presentacion: 'pr', cuentaGit: 'git' },
                { nombre: 'n', apellido: 'a', nombreFantasia: null, pronombres: 'p', presentacion: 'pr' }],
            ['Postulacion', { _id: ID_ENTIDAD, mensaje: 'm', estado: 'Pendiente' }, { mensaje: 'm' }]
        ])('%s revisa solo sus campos de texto libre', async (tipo, entidad, campos) => {
            palabraBaneadaService.detectarEnCampos.mockResolvedValue({});

            await reporteService.revisarPalabrasBaneadas(tipo, entidad);

            expect(palabraBaneadaService.detectarEnCampos).toHaveBeenCalledWith(campos);
            expect(reporteRepository.solucionarPendientes).toHaveBeenCalledWith(ID_ENTIDAD);
        });
    });

    describe('revisarEnSegundoPlano', () => {
        const entidad = { id: ID_ENTIDAD, mensaje: 'algo' };

        test('no espera la revisión', () => {
            palabraBaneadaService.detectarEnCampos.mockReturnValue(new Promise(() => {}));

            expect(reporteService.revisarEnSegundoPlano('Postulacion', entidad)).toBeUndefined();
            expect(palabraBaneadaService.detectarEnCampos).toHaveBeenCalled();
        });

        test('si la revisión falla solo loguea el error', async () => {
            const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
            palabraBaneadaService.detectarEnCampos.mockRejectedValue(new Error('se cayó mongo'));

            reporteService.revisarEnSegundoPlano('Postulacion', entidad);
            await new Promise(setImmediate);

            expect(consola).toHaveBeenCalledWith(expect.stringContaining(`Postulacion ${ID_ENTIDAD} | Error: se cayó mongo`));
            consola.mockRestore();
        });
    });
});