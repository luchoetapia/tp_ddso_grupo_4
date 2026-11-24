jest.mock('../../src/services/notificacionService.js', () => ({
    obtenerPropias: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const notificacionService = require('../../src/services/notificacionService.js');
const { cookieDeSesion, ID_USUARIO } = require('../helpers/sesion.js');

const notificacion = {
    id: '507f1f77bcf86cd799439051',
    destinatario: ID_USUARIO,
    mensaje: 'El equipo de moderación te pide revisar tu proyecto',
    fecha: '2026-11-20T00:00:00.000Z',
    automatica: true,
};

describe('Endpoints /notificaciones', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /notificaciones/me', () => {
        test('responde 401 sin sesión', async () => {
            const res = await request(app).get('/notificaciones/me');

            expect(res.status).toBe(401);
            expect(notificacionService.obtenerPropias).not.toHaveBeenCalled();
        });

        test.each(['colaborador', 'colectivo', 'admin'])('devuelve los mensajes del usuario de la sesión (%s)', async (rol) => {
            notificacionService.obtenerPropias.mockResolvedValue([notificacion]);

            const res = await request(app).get('/notificaciones/me').set('Cookie', cookieDeSesion(rol));

            expect(res.status).toBe(200);
            expect(notificacionService.obtenerPropias).toHaveBeenCalledWith(expect.objectContaining({ id: ID_USUARIO, rol }));
            expect(res.body).toEqual([{
                id: notificacion.id,
                mensaje: notificacion.mensaje,
                fecha: notificacion.fecha,
                automatica: true,
            }]);
        });
    });
});
