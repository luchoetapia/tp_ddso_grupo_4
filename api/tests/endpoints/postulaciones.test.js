jest.mock('../../src/services/postulacionService.js', () => ({
    obtenerTodas: jest.fn(),
    obtenerPorId: jest.fn(),
    crear: jest.fn(),
    actualizarEstado: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const postulacionService = require('../../src/services/postulacionService.js');
const { ForbiddenError } = require('../../src/errors/AppError.js');
const { roles } = require('../../src/auth/models/usuario.js');
const { cookieDeSesion, ID_USUARIO } = require('../helpers/sesion.js');

const ID = '507f1f77bcf86cd799439071';
const ID_PROY = '507f1f77bcf86cd799439041';
const ID_PERFIL = '507f1f77bcf86cd799439031';

const postulacion = {
    id: ID,
    estado: 'Pendiente',
    mensaje: '',
    fecha: '2026-11-18T00:00:00.000Z',
    perfil: ID_PERFIL,
    proyecto: { _id: ID_PROY, titulo: 'Aula Virtual' },
    colaborador: { _id: '507f1f77bcf86cd799439011', cuentaGit: 'juanp' },
};

const sesion = (rol) => ['Cookie', cookieDeSesion(rol)];
const usuarioDeLaSesion = (rol) => expect.objectContaining({ id: ID_USUARIO, rol });

describe('Endpoints /postulaciones (control de acceso)', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('GET /postulaciones', () => {
        test('responde 401 sin sesión', async () => {
            const res = await request(app).get('/postulaciones');

            expect(res.status).toBe(401);
            expect(postulacionService.obtenerTodas).not.toHaveBeenCalled();
        });

        test('pasa la sesión al service para acotar los resultados', async () => {
            postulacionService.obtenerTodas.mockResolvedValue([postulacion]);

            const res = await request(app).get(`/postulaciones?idProyecto=${ID_PROY}`).set(...sesion(roles.COLECTIVO));

            expect(res.status).toBe(200);
            expect(postulacionService.obtenerTodas).toHaveBeenCalledWith({ idProyecto: ID_PROY }, usuarioDeLaSesion(roles.COLECTIVO));
        });

        test('responde 403 si el service rechaza el acceso', async () => {
            postulacionService.obtenerTodas.mockRejectedValue(new ForbiddenError('Solo podés ver tus propias postulaciones'));

            const res = await request(app).get('/postulaciones').set(...sesion(roles.COLABORADOR));

            expect(res.status).toBe(403);
        });
    });

    describe('POST /postulaciones', () => {
        const body = { idProyecto: ID_PROY, idPerfil: ID_PERFIL };

        test('la colaboradora se postula (la colaboradora sale de la sesión)', async () => {
            postulacionService.crear.mockResolvedValue(postulacion);

            const res = await request(app).post('/postulaciones').set(...sesion(roles.COLABORADOR)).send(body);

            expect(res.status).toBe(201);
            expect(postulacionService.crear).toHaveBeenCalledWith(expect.objectContaining(body), usuarioDeLaSesion(roles.COLABORADOR));
        });

        test('responde 401 sin sesión y 403 con sesión de colectivo', async () => {
            const sinSesion = await request(app).post('/postulaciones').send(body);
            const comoColectivo = await request(app).post('/postulaciones').set(...sesion(roles.COLECTIVO)).send(body);

            expect(sinSesion.status).toBe(401);
            expect(comoColectivo.status).toBe(403);
            expect(postulacionService.crear).not.toHaveBeenCalled();
        });
    });

    describe('GET /postulaciones/:id', () => {
        test('responde 401 sin sesión', async () => {
            const res = await request(app).get(`/postulaciones/${ID}`);

            expect(res.status).toBe(401);
        });

        test('responde 403 si la postulación no es de la sesión', async () => {
            postulacionService.obtenerPorId.mockRejectedValue(new ForbiddenError('No tenés acceso a esta postulación'));

            const res = await request(app).get(`/postulaciones/${ID}`).set(...sesion(roles.COLABORADOR));

            expect(res.status).toBe(403);
            expect(postulacionService.obtenerPorId).toHaveBeenCalledWith(ID, usuarioDeLaSesion(roles.COLABORADOR));
        });
    });

    describe('PATCH /postulaciones/:id/estado', () => {
        test('el colectivo acepta la postulación', async () => {
            postulacionService.actualizarEstado.mockResolvedValue({ ...postulacion, estado: 'Aceptada' });

            const res = await request(app).patch(`/postulaciones/${ID}/estado`).set(...sesion(roles.COLECTIVO)).send({ estado: 'Aceptada' });

            expect(res.status).toBe(200);
            expect(postulacionService.actualizarEstado).toHaveBeenCalledWith(ID, 'Aceptada', usuarioDeLaSesion(roles.COLECTIVO));
        });

        test('responde 401 sin sesión y 403 con sesión de colaboradora', async () => {
            const sinSesion = await request(app).patch(`/postulaciones/${ID}/estado`).send({ estado: 'Aceptada' });
            const comoColaboradora = await request(app).patch(`/postulaciones/${ID}/estado`).set(...sesion(roles.COLABORADOR))
                .send({ estado: 'Aceptada' });

            expect(sinSesion.status).toBe(401);
            expect(comoColaboradora.status).toBe(403);
            expect(postulacionService.actualizarEstado).not.toHaveBeenCalled();
        });

        test('responde 403 si el proyecto es de otro colectivo', async () => {
            postulacionService.actualizarEstado.mockRejectedValue(new ForbiddenError('El proyecto no pertenece a tu colectivo'));

            const res = await request(app).patch(`/postulaciones/${ID}/estado`).set(...sesion(roles.COLECTIVO)).send({ estado: 'Rechazada' });

            expect(res.status).toBe(403);
        });
    });
});
