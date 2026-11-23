jest.mock('../../src/services/colaboracionService.js', () => ({
    obtenerTodas: jest.fn(),
    crear: jest.fn(),
    desanotar: jest.fn(),
}));
// El middleware auditar() guarda un registro por cada acción exitosa: se mockea para no escribir en la base
jest.mock('../../src/services/auditoriaService.js', () => ({
    registrar: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const colaboracionService = require('../../src/services/colaboracionService.js');
const auditoriaService = require('../../src/services/auditoriaService.js');
const { ConflictError, ForbiddenError, NotFoundError } = require('../../src/errors/AppError.js');
const { cookieDeSesion, ID_USUARIO } = require('../helpers/sesion.js');
const { roles } = require('../../src/auth/models/usuario.js');
const { AccionAuditada, TipoEntidadAuditada } = require('../../src/models/Auditoria.js');

// Crear colaboraciones a mano es solo para administradores
const admin = cookieDeSesion(roles.ADMIN);

const ID_PROY = '507f1f77bcf86cd799439041';
const ID_COLAB = '507f1f77bcf86cd799439011';
const colaboracionPublica = {
    id: '507f1f77bcf86cd799439061',
    colaborador: { nombre: 'Juan', apellido: 'Pérez' },
    proyecto: { id: ID_PROY, titulo: 'Aula Virtual' },
    inicio: '2024-01-01T00:00:00.000Z', fin: null, esAnonima: false,
};
// Como lo devuelve el repositorio: referencias populadas con campos de más
const colaboracion = {
    ...colaboracionPublica,
    colaborador: { ...colaboracionPublica.colaborador, id: ID_COLAB, cuentaGit: 'juanp' },
    proyecto: { ...colaboracionPublica.proyecto, descripcion: 'desc' },
};

// Resultado paginado como lo devuelven los services
const paginaDe = (colaboraciones, extra = {}) => ({ colaboraciones, total: colaboraciones.length, pagina: 1, limite: 10, totalPaginas: 1, ...extra });
const paginacionDefault = { pagina: 1, limite: 10 };

describe('Endpoints /colaboraciones', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('GET /colaboraciones', () => {
        test('devuelve la lista de colaboraciones', async () => {
            colaboracionService.obtenerTodas.mockResolvedValue(paginaDe([colaboracion]));

            const res = await request(app).get('/colaboraciones');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: [colaboracionPublica], paginacion: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 } });
            expect(colaboracionService.obtenerTodas).toHaveBeenCalledWith(paginacionDefault);
        });

        test('oculta al colaborador si la colaboración es anónima', async () => {
            colaboracionService.obtenerTodas.mockResolvedValue(paginaDe([{ ...colaboracion, esAnonima: true }]));

            const res = await request(app).get('/colaboraciones');

            expect(res.body.data[0].colaborador).toBeNull();
            expect(res.body.data[0].esAnonima).toBe(true);
        });
    });

    describe('POST /colaboraciones', () => {
        const body = { idProyecto: ID_PROY, idColaborador: ID_COLAB };

        test('crea la colaboración', async () => {
            colaboracionService.crear.mockResolvedValue(colaboracion);

            const res = await request(app).post('/colaboraciones').set('Cookie', admin).send(body);

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: 'Colaboracion creada exitosamente', data: colaboracionPublica });
            expect(colaboracionService.crear).toHaveBeenCalledWith(body);
            expect(auditoriaService.registrar).toHaveBeenCalledWith(expect.objectContaining({
                accion: AccionAuditada.COLABORACION_CREADA,
                entidad: { tipo: TipoEntidadAuditada.COLABORACION, id: colaboracionPublica.id },
                idProyecto: ID_PROY,
            }));
        });

        test('responde 403 si no es administrador', async () => {
            const res = await request(app).post('/colaboraciones').set('Cookie', cookieDeSesion(roles.COLABORADOR)).send(body);

            expect(res.status).toBe(403);
            expect(colaboracionService.crear).not.toHaveBeenCalled();
        });

        test('responde 400 con ids inválidos', async () => {
            const res = await request(app).post('/colaboraciones').set('Cookie', admin).send({ idProyecto: '1', idColaborador: ID_COLAB });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Id de proyecto inválido');
            expect(colaboracionService.crear).not.toHaveBeenCalled();
        });

        test('responde 400 sin body', async () => {
            const res = await request(app).post('/colaboraciones').set('Cookie', admin);

            expect(res.status).toBe(400);
        });

        test('responde 404 si el proyecto no existe', async () => {
            colaboracionService.crear.mockRejectedValue(new NotFoundError('Proyecto no encontrado'));

            const res = await request(app).post('/colaboraciones').set('Cookie', admin).send(body);

            expect(res.status).toBe(404);
        });

        test('responde 409 si el proyecto está finalizado', async () => {
            colaboracionService.crear.mockRejectedValue(new ConflictError('El proyecto ya fue finalizado'));

            const res = await request(app).post('/colaboraciones').set('Cookie', admin).send(body);

            expect(res.status).toBe(409);
            expect(res.body.message).toBe('El proyecto ya fue finalizado');
            // Las acciones que fallan no se auditan
            expect(auditoriaService.registrar).not.toHaveBeenCalled();
        });
    });

    describe('POST /colaboraciones/:id/desanotar', () => {
    const url = `/colaboraciones/${colaboracionPublica.id}/desanotar`;

    test('da de baja la colaboración', async () => {
        colaboracionService.desanotar.mockResolvedValue({ ...colaboracion, fin: new Date('2024-06-01') });

        const res = await request(app).post(url).set('Cookie', cookieDeSesion(roles.COLABORADOR));

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Colaboración dada de baja exitosamente');
        expect(res.body.data.fin).toBe('2024-06-01T00:00:00.000Z');
        expect(colaboracionService.desanotar).toHaveBeenCalledWith(
            colaboracionPublica.id, expect.objectContaining({ id: ID_USUARIO, rol: roles.COLABORADOR })
        );
        expect(auditoriaService.registrar).toHaveBeenCalledWith(expect.objectContaining({
            accion: AccionAuditada.COLABORACION_DADA_DE_BAJA,
            detalle: 'Dada de baja por: la colaboradora',
        }));
    });

    test('responde 401 sin sesión', async () => {
        const res = await request(app).post(url);

        expect(res.status).toBe(401);
        expect(colaboracionService.desanotar).not.toHaveBeenCalled();
    });

    test('responde 403 si el rol no es colaborador ni colectivo', async () => {
        const res = await request(app).post(url).set('Cookie', cookieDeSesion(roles.ADMIN));

        expect(res.status).toBe(403);
        expect(colaboracionService.desanotar).not.toHaveBeenCalled();
    });

    test('responde 400 con id inválido', async () => {
        const res = await request(app).post('/colaboraciones/abc/desanotar').set('Cookie', cookieDeSesion(roles.COLECTIVO));

        expect(res.status).toBe(400);
    });

    test('responde 403 si el servicio rechaza por falta de pertenencia', async () => {
        colaboracionService.desanotar.mockRejectedValue(new ForbiddenError('El proyecto no pertenece a tu colectivo'));

        const res = await request(app).post(url).set('Cookie', cookieDeSesion(roles.COLECTIVO));

        expect(res.status).toBe(403);
    });

    test('responde 409 si ya estaba dada de baja', async () => {
        colaboracionService.desanotar.mockRejectedValue(new ConflictError('La colaboración ya fue dada de baja'));

        const res = await request(app).post(url).set('Cookie', cookieDeSesion(roles.COLABORADOR));

        expect(res.status).toBe(409);
    });

    test('responde 404 si la colaboración no existe', async () => {
        colaboracionService.desanotar.mockRejectedValue(new NotFoundError('Colaboración no encontrada'));

        const res = await request(app).post(url).set('Cookie', cookieDeSesion(roles.COLABORADOR));

        expect(res.status).toBe(404);
    });
    });
});
