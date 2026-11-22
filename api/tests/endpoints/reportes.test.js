jest.mock('../../src/services/reporteService.js', () => ({
    listar: jest.fn(),
    obtenerDetalle: jest.fn(),
    notificar: jest.fn(),
    validar: jest.fn(),
    rechazar: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const reporteService = require('../../src/services/reporteService.js');
const { ConflictError, NotFoundError } = require('../../src/errors/AppError.js');
const { cookieDeSesion, ID_USUARIO } = require('../helpers/sesion.js');

const ID = '507f1f77bcf86cd799439091';
const ID_ENTIDAD = '507f1f77bcf86cd799439041';
const FECHA = '2026-11-20T00:00:00.000Z';

const reporte = {
    id: ID,
    entidad: { tipo: 'Proyecto', id: ID_ENTIDAD },
    motivo: 'Palabras prohibidas detectadas en: titulo (tonto)',
    estado: 'Pendiente',
    duenio: { id: 'u1', username: 'colectivo', email: 'c@mail.com', password: 'hash' },
    notificado: false,
    fechaNotificacion: null,
    fechaSolucion: null,
    revisadoPor: null,
    fechaRevision: null,
    comentarioRevision: null,
    createdAt: FECHA
};

const reportePublico = {
    id: ID,
    entidad: { tipo: 'Proyecto', id: ID_ENTIDAD },
    motivo: 'Palabras prohibidas detectadas en: titulo (tonto)',
    estado: 'Pendiente',
    duenio: { id: 'u1', username: 'colectivo', email: 'c@mail.com' },
    notificado: false,
    fechaNotificacion: null,
    fechaSolucion: null,
    revisadoPor: null,
    fechaRevision: null,
    comentarioRevision: null,
    fechaCreacion: FECHA
};

const admin = cookieDeSesion('admin');

describe('Endpoints /reportes', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('autorización', () => {
        test.each([
            ['get', '/reportes'],
            ['get', `/reportes/${ID}`],
            ['patch', `/reportes/${ID}/notificar`],
            ['patch', `/reportes/${ID}/validar`],
            ['patch', `/reportes/${ID}/rechazar`],
        ])('%s %s responde 401 sin sesión y 403 si no es admin', async (metodo, ruta) => {
            expect((await request(app)[metodo](ruta)).status).toBe(401);
            expect((await request(app)[metodo](ruta).set('Cookie', cookieDeSesion('colaborador'))).status).toBe(403);
        });
    });

    describe('GET /reportes', () => {
        test('devuelve la página de reportes sin datos sensibles del dueño', async () => {
            reporteService.listar.mockResolvedValue({ reportes: [reporte], total: 1, pagina: 1, limite: 10, totalPaginas: 1 });

            const res = await request(app).get('/reportes').set('Cookie', admin);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: [reportePublico], paginacion: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 } });
            expect(reporteService.listar).toHaveBeenCalledWith({ pagina: 1, limite: 10, estado: undefined, tipoEntidad: undefined });
        });

        test('filtra por estado y tipo de entidad', async () => {
            reporteService.listar.mockResolvedValue({ reportes: [], total: 0, pagina: 1, limite: 10, totalPaginas: 0 });

            await request(app).get('/reportes?estado=Pendiente&tipoEntidad=Colectivo').set('Cookie', admin);

            expect(reporteService.listar).toHaveBeenCalledWith({ pagina: 1, limite: 10, estado: 'Pendiente', tipoEntidad: 'Colectivo' });
        });

        test.each(['estado=Borrado', 'tipoEntidad=Habilidad'])('responde 400 con %s', async (query) => {
            const res = await request(app).get(`/reportes?${query}`).set('Cookie', admin);

            expect(res.status).toBe(400);
            expect(reporteService.listar).not.toHaveBeenCalled();
        });
    });

    describe('GET /reportes/:id', () => {
        test('devuelve el reporte con el contenido de la entidad', async () => {
            reporteService.obtenerDetalle.mockResolvedValue({ reporte, contenido: { titulo: 'Proyecto tonto' } });

            const res = await request(app).get(`/reportes/${ID}`).set('Cookie', admin);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ ...reportePublico, contenido: { titulo: 'Proyecto tonto' } });
        });

        test('responde 400 con id inválido y 404 si no existe', async () => {
            expect((await request(app).get('/reportes/abc').set('Cookie', admin)).status).toBe(400);

            reporteService.obtenerDetalle.mockRejectedValue(new NotFoundError('Reporte no encontrado'));
            expect((await request(app).get(`/reportes/${ID}`).set('Cookie', admin)).status).toBe(404);
        });
    });

    describe('PATCH /reportes/:id/notificar', () => {
        test('marca el reporte como notificado', async () => {
            reporteService.notificar.mockResolvedValue({ ...reporte, notificado: true, fechaNotificacion: FECHA });

            const res = await request(app).patch(`/reportes/${ID}/notificar`).set('Cookie', admin);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ estado: 'Pendiente', notificado: true, fechaNotificacion: FECHA });
            expect(reporteService.notificar).toHaveBeenCalledWith(ID);
        });
    });

    describe.each([
        ['validar', 'Validado'],
        ['rechazar', 'Rechazado'],
    ])('PATCH /reportes/:id/%s', (accion, estado) => {
        test('resuelve el reporte con el admin de la sesión y el comentario', async () => {
            reporteService[accion].mockResolvedValue({ ...reporte, estado, revisadoPor: { id: ID_USUARIO, username: 'admin' } });

            const res = await request(app).patch(`/reportes/${ID}/${accion}`).set('Cookie', admin).send({ comentario: ' contexto ' });

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ estado, revisadoPor: { id: ID_USUARIO, username: 'admin' } });
            expect(reporteService[accion]).toHaveBeenCalledWith(ID, ID_USUARIO, 'contexto');
        });

        test('el comentario es opcional', async () => {
            reporteService[accion].mockResolvedValue({ ...reporte, estado });

            const res = await request(app).patch(`/reportes/${ID}/${accion}`).set('Cookie', admin);

            expect(res.status).toBe(200);
            expect(reporteService[accion]).toHaveBeenCalledWith(ID, ID_USUARIO, undefined);
        });

        test('responde 400 con campos extra', async () => {
            const res = await request(app).patch(`/reportes/${ID}/${accion}`).set('Cookie', admin).send({ estado: 'Validado' });

            expect(res.status).toBe(400);
            expect(reporteService[accion]).not.toHaveBeenCalled();
        });

        test('responde 409 si el reporte ya estaba resuelto', async () => {
            reporteService[accion].mockRejectedValue(new ConflictError("El reporte ya fue resuelto como 'Rechazado'"));

            const res = await request(app).patch(`/reportes/${ID}/${accion}`).set('Cookie', admin);

            expect(res.status).toBe(409);
        });
    });
});
