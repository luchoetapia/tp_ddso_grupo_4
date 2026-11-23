jest.mock('../../src/services/proyectoService.js', () => ({
    eliminar: jest.fn(),
}));
jest.mock('../../src/services/auditoriaService.js', () => ({
    registrar: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const proyectoService = require('../../src/services/proyectoService.js');
const auditoriaService = require('../../src/services/auditoriaService.js');
const { ConflictError, ForbiddenError, NotFoundError } = require('../../src/errors/AppError.js');
const { roles } = require('../../src/auth/models/usuario.js');
const { cookieDeSesion, ID_USUARIO } = require('../helpers/sesion.js');
const { AccionAuditada, TipoEntidadAuditada } = require('../../src/models/Auditoria.js');

const ID = '507f1f77bcf86cd799439041';
const ID_COLECTIVO = '507f1f77bcf86cd799439051';
const url = `/proyectos/${ID}`;
const colectivo = cookieDeSesion(roles.COLECTIVO);

describe('DELETE /proyectos/:id', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    test('elimina el proyecto del colectivo de la sesión y lo audita', async () => {
        proyectoService.eliminar.mockResolvedValueOnce({
            proyecto: { id: ID, titulo: 'Aula Virtual' },
            colectivo: { id: ID_COLECTIVO },
        });

        const res = await request(app).delete(url).set('Cookie', colectivo);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Proyecto eliminado exitosamente' });
        expect(proyectoService.eliminar).toHaveBeenCalledWith(ID, ID_USUARIO);
        // El proyecto ya no existe: el colectivo y el título los pasa el controller, no se deducen después
        expect(auditoriaService.registrar).toHaveBeenCalledWith(expect.objectContaining({
            accion: AccionAuditada.PROYECTO_ELIMINADO,
            entidad: { tipo: TipoEntidadAuditada.PROYECTO, id: ID },
            idColectivo: ID_COLECTIVO,
            detalle: 'Título: Aula Virtual',
        }));
    });

    test('responde 401 sin sesión', async () => {
        const res = await request(app).delete(url);

        expect(res.status).toBe(401);
        expect(proyectoService.eliminar).not.toHaveBeenCalled();
    });

    test('responde 403 si la sesión no es de un colectivo', async () => {
        const res = await request(app).delete(url).set('Cookie', cookieDeSesion(roles.COLABORADOR));

        expect(res.status).toBe(403);
        expect(proyectoService.eliminar).not.toHaveBeenCalled();
    });

    test('responde 400 con un id inválido', async () => {
        const res = await request(app).delete('/proyectos/abc').set('Cookie', colectivo);

        expect(res.status).toBe(400);
        expect(proyectoService.eliminar).not.toHaveBeenCalled();
    });

    test.each([
        ['403 si el proyecto es de otro colectivo', new ForbiddenError('El proyecto no pertenece a tu colectivo'), 403],
        ['404 si el proyecto no existe', new NotFoundError('Proyecto no encontrado'), 404],
        ['409 si el proyecto tiene colaboraciones', new ConflictError('El proyecto tiene colaboraciones registradas: finalizalo en lugar de eliminarlo'), 409],
    ])('responde %s y no audita', async (_, error, status) => {
        proyectoService.eliminar.mockRejectedValueOnce(error);

        const res = await request(app).delete(url).set('Cookie', colectivo);

        expect(res.status).toBe(status);
        expect(res.body.message).toBe(error.message);
        expect(auditoriaService.registrar).not.toHaveBeenCalled();
    });
});
