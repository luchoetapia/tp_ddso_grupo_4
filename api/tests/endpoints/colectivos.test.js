jest.mock('../../src/auth/usuarioSemilla.js', () => ({
    crearUsuarioDeSemilla: jest.fn(),
}));
jest.mock('../../src/services/colectivoService.js', () => ({
    obtenerTodos: jest.fn(),
    crear: jest.fn(),
    obtenerPorId: jest.fn(),
    obtenerActivos: jest.fn(),
    desactivarColectivo: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const colectivoService = require('../../src/services/colectivoService.js');
const { crearUsuarioDeSemilla } = require('../../src/auth/usuarioSemilla.js');
const { cookieDeSesion, ID_USUARIO } = require('../helpers/sesion.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../src/errors/AppError.js');

const ID = '507f1f77bcf86cd799439051';
const colectivo = { id: ID, nombre: 'Tech For Good', descripcion: 'desc', ubicacion: 'Córdoba', tipo: 'fundacion', proyectos: [] };

describe('Endpoints /colectivos', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('GET /colectivos', () => {
        test('devuelve la lista de colectivos', async () => {
            colectivoService.obtenerTodos.mockResolvedValue([colectivo]);

            const res = await request(app).get('/colectivos');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([colectivo]);
        });

        test('con activos=true devuelve solo los activos', async () => {
            colectivoService.obtenerActivos.mockResolvedValue([colectivo]);

            const res = await request(app).get('/colectivos?activos=true');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([colectivo]);
            expect(colectivoService.obtenerActivos).toHaveBeenCalled();
            expect(colectivoService.obtenerTodos).not.toHaveBeenCalled();
        });

        test('con activos=false devuelve todos', async () => {
            colectivoService.obtenerTodos.mockResolvedValue([colectivo]);

            const res = await request(app).get('/colectivos?activos=false');

            expect(res.status).toBe(200);
            expect(colectivoService.obtenerTodos).toHaveBeenCalled();
            expect(colectivoService.obtenerActivos).not.toHaveBeenCalled();
        });

        test('responde 400 con un valor de activos inválido', async () => {
            const res = await request(app).get('/colectivos?activos=si');

            expect(res.status).toBe(400);
            expect(colectivoService.obtenerTodos).not.toHaveBeenCalled();
            expect(colectivoService.obtenerActivos).not.toHaveBeenCalled();
        });
    });

    describe('POST /colectivos', () => {
        test('crea el colectivo aplicando defaults del validador', async () => {
            colectivoService.crear.mockResolvedValue(colectivo);

            const res = await request(app).post('/colectivos').set('Cookie', cookieDeSesion('colectivo')).send({ nombre: 'Tech For Good', tipo: 'fundacion' });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: 'Colectivo creado exitosamente', data: colectivo });
            expect(colectivoService.crear).toHaveBeenCalledWith({ nombre: 'Tech For Good', tipo: 'fundacion', proyectos: [] }, ID_USUARIO);
        });

        test('responde 400 con un tipo inválido', async () => {
            const res = await request(app).post('/colectivos').set('Cookie', cookieDeSesion('colectivo')).send({ nombre: 'X', tipo: 'club' });

            expect(res.status).toBe(400);
            expect(colectivoService.crear).not.toHaveBeenCalled();
        });

        test('responde 400 con ids de proyectos inválidos', async () => {
            const res = await request(app).post('/colectivos').set('Cookie', cookieDeSesion('colectivo')).send({ nombre: 'X', tipo: 'ong', proyectos: ['123'] });

            expect(res.status).toBe(400);
        });

        test('responde 409 si ya existe', async () => {
            colectivoService.crear.mockRejectedValue(new ConflictError('Ya existe un colectivo con ese nombre'));

            const res = await request(app).post('/colectivos').set('Cookie', cookieDeSesion('colectivo')).send({ nombre: 'X', tipo: 'ong' });

            expect(res.status).toBe(409);
        });
    
        test('el colectivo se asocia al usuario de la sesión y no a uno enviado en el body', async () => {
            colectivoService.crear.mockResolvedValue(colectivo);

            const res = await request(app).post('/colectivos')
                .set('Cookie', cookieDeSesion('colectivo'))
                .send({ nombre: 'X', tipo: 'ong', usuario: 'otro' });

            expect(res.status).toBe(400); // el validador es strict: no admite "usuario" en el body
            expect(colectivoService.crear).not.toHaveBeenCalled();
        });

        test('responde 401 sin sesión', async () => {
            const res = await request(app).post('/colectivos').send({ nombre: 'X', tipo: 'ong' });

            expect(res.status).toBe(401);
            expect(colectivoService.crear).not.toHaveBeenCalled();
        });

        test('responde 403 si el usuario no tiene rol colectivo', async () => {
            const res = await request(app).post('/colectivos')
                .set('Cookie', cookieDeSesion('colaborador'))
                .send({ nombre: 'X', tipo: 'ong' });

            expect(res.status).toBe(403);
            expect(colectivoService.crear).not.toHaveBeenCalled();
        });
    });

    describe('GET /colectivos/:id', () => {
        test('devuelve el colectivo', async () => {
            colectivoService.obtenerPorId.mockResolvedValue(colectivo);

            const res = await request(app).get(`/colectivos/${ID}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(colectivo);
        });

        test('responde 400 con un id inválido', async () => {
            const res = await request(app).get('/colectivos/abc');

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Id de colectivo inválido');
        });

        test('responde 404 si no existe', async () => {
            colectivoService.obtenerPorId.mockRejectedValue(new NotFoundError('Colectivo no encontrado'));

            const res = await request(app).get(`/colectivos/${ID}`);

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /colectivos/:id', () => {
        test('desactiva el colectivo', async () => {
            const resultado = { mensaje: 'Colectivo Tech For Good desactivado correctamente, 2 proyectos finalizados.' };
            colectivoService.desactivarColectivo.mockResolvedValue(resultado);

            const res = await request(app).delete(`/colectivos/${ID}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(resultado);
            expect(colectivoService.desactivarColectivo).toHaveBeenCalledWith(ID);
        });

        test('responde 400 con un id inválido', async () => {
            const res = await request(app).delete('/colectivos/abc');

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Id de colectivo inválido');
            expect(colectivoService.desactivarColectivo).not.toHaveBeenCalled();
        });

        test('responde 404 si no existe', async () => {
            colectivoService.desactivarColectivo.mockRejectedValue(new NotFoundError('Colectivo no encontrado'));

            const res = await request(app).delete(`/colectivos/${ID}`);

            expect(res.status).toBe(404);
        });

        test('responde 400 si ya estaba desactivado', async () => {
            colectivoService.desactivarColectivo.mockRejectedValue(new BadRequestError('El colectivo ya se encuentra desactivado'));

            const res = await request(app).delete(`/colectivos/${ID}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('El colectivo ya se encuentra desactivado');
        });
    });

    describe('POST /colectivos/llenarDatosPrueba', () => {
        test('crea los colectivos por defecto, cada uno con su usuario', async () => {
            crearUsuarioDeSemilla.mockImplementation(async (nombre) => ({ id: `usr-${nombre}` }));
            colectivoService.crear.mockImplementation(async (datos) => ({ id: ID, ...datos }));

            const res = await request(app).post('/colectivos/llenarDatosPrueba');

            expect(res.status).toBe(201);
            expect(res.body.data.map(c => c.nombre)).toEqual(['Colectivo Software Libre', 'Tech For Good']);
            expect(crearUsuarioDeSemilla).toHaveBeenCalledWith('Colectivo Software Libre', 'colectivo');
            expect(colectivoService.crear).toHaveBeenCalledWith(
                expect.objectContaining({ nombre: 'Tech For Good' }), 'usr-Tech For Good'
            );
        });

        test('responde 400 si algún elemento es inválido', async () => {
            const res = await request(app).post('/colectivos/llenarDatosPrueba').send([{ nombre: 'Sin tipo' }]);

            expect(res.status).toBe(400);
        });
    });
});
