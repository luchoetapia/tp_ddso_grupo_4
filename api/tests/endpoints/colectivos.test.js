jest.mock('../../src/auth/usuarioSemilla.js', () => ({
    crearUsuarioDeSemilla: jest.fn(),
}));
jest.mock('../../src/services/colectivoService.js', () => ({
    obtenerTodos: jest.fn(),
    crear: jest.fn(),
    obtenerPorId: jest.fn(),
    obtenerActivos: jest.fn(),
    desactivarColectivo: jest.fn(),
    buscarPorUsuario: jest.fn(),
    obtenerPotencialesColaboradores: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const colectivoService = require('../../src/services/colectivoService.js');
const { crearUsuarioDeSemilla } = require('../../src/auth/usuarioSemilla.js');
const { cookieDeSesion, ID_USUARIO } = require('../helpers/sesion.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../src/errors/AppError.js');
const { roles } = require('../../src/auth/models/usuario.js');

const ID = '507f1f77bcf86cd799439051';
const colectivo = { id: ID, nombre: 'Tech For Good', descripcion: 'desc', ubicacion: 'Córdoba', tipo: 'fundacion', proyectos: [] };

// Resultado paginado como lo devuelven los services
const paginaDe = (colectivos, extra = {}) => ({ colectivos, total: colectivos.length, pagina: 1, limite: 10, totalPaginas: 1, ...extra });
const paginacionDefault = { pagina: 1, limite: 10 };

describe('Endpoints /colectivos', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('GET /colectivos', () => {
        test('devuelve la lista de colectivos', async () => {
            colectivoService.obtenerTodos.mockResolvedValue(paginaDe([colectivo]));

            const res = await request(app).get('/colectivos');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: [colectivo], paginacion: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 } });
            expect(colectivoService.obtenerTodos).toHaveBeenCalledWith(paginacionDefault);
        });

        test('con activos=true devuelve solo los activos', async () => {
            colectivoService.obtenerActivos.mockResolvedValue(paginaDe([colectivo]));

            const res = await request(app).get('/colectivos?activos=true&limite=20');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([colectivo]);
            expect(colectivoService.obtenerActivos).toHaveBeenCalledWith({ pagina: 1, limite: 20 });
            expect(colectivoService.obtenerTodos).not.toHaveBeenCalled();
        });

        test('con activos=false devuelve todos', async () => {
            colectivoService.obtenerTodos.mockResolvedValue(paginaDe([colectivo]));

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

    describe('GET /colectivos/me/potencialesColaboradores', () => {
        const ID_PROY = '507f1f77bcf86cd799439041';
        const ID_PROY_2 = '507f1f77bcf86cd799439042';
        const URL = '/colectivos/me/potencialesColaboradores';
        const colaborador = { id: 'c1', nombre: 'Ana', apellido: 'Paz', nombreFantasia: null, cuentaGit: 'ana', habilidades: [], pronombres: 'ella', presentacion: null, deseaSerContactado: true };

        test('devuelve la página de colaboradoras con la paginación', async () => {
            colectivoService.buscarPorUsuario.mockResolvedValue(colectivo);
            const perfilesCompatibles = [{ proyecto: { id: ID_PROY, titulo: 'Huerta' }, perfil: { id: 'pf1', titulo: 'Back' } }];
            colectivoService.obtenerPotencialesColaboradores.mockResolvedValue({ colaboradores: [{ colaborador, perfilesCompatibles }], total: 11, pagina: 2, limite: 5, totalPaginas: 3 });

            const res = await request(app)
                .get(`${URL}?proyectos=${ID_PROY},${ID_PROY_2}&pagina=2&limite=5&orden=nombre&direccion=desc`)
                .set('Cookie', cookieDeSesion(roles.COLECTIVO));

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].cuentaGit).toBe('ana');
            expect(res.body.data[0]).not.toHaveProperty('contactos');
            expect(res.body.data[0].perfilesCompatibles).toEqual(perfilesCompatibles);
            expect(res.body.paginacion).toEqual({ pagina: 2, limite: 5, total: 11, totalPaginas: 3 });
            expect(colectivoService.obtenerPotencialesColaboradores).toHaveBeenCalledWith(
                ID, [ID_PROY, ID_PROY_2], { pagina: 2, limite: 5, orden: 'nombre', direccion: 'desc' }
            );
        });

        test('sin filtros usa la paginación por defecto y todos los proyectos', async () => {
            colectivoService.buscarPorUsuario.mockResolvedValue(colectivo);
            colectivoService.obtenerPotencialesColaboradores.mockResolvedValue({ colaboradores: [], total: 0, pagina: 1, limite: 10, totalPaginas: 0 });

            const res = await request(app).get(URL).set('Cookie', cookieDeSesion(roles.COLECTIVO));

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: [], paginacion: { pagina: 1, limite: 10, total: 0, totalPaginas: 0 } });
            expect(colectivoService.obtenerPotencialesColaboradores).toHaveBeenCalledWith(ID, [], paginacionDefault);
        });

        test('responde 400 con un id de proyecto o un límite inválidos', async () => {
            const cookie = cookieDeSesion(roles.COLECTIVO);

            expect((await request(app).get(`${URL}?proyectos=malo`).set('Cookie', cookie)).status).toBe(400);
            expect((await request(app).get(`${URL}?limite=500`).set('Cookie', cookie)).status).toBe(400);
            expect(colectivoService.obtenerPotencialesColaboradores).not.toHaveBeenCalled();
        });

        test('responde 404 si el usuario no tiene colectivo', async () => {
            colectivoService.buscarPorUsuario.mockResolvedValue(null);

            const res = await request(app).get(URL).set('Cookie', cookieDeSesion(roles.COLECTIVO));

            expect(res.status).toBe(404);
        });

        test('responde 401 sin sesión y 403 con otro rol', async () => {
            expect((await request(app).get(URL)).status).toBe(401);
            expect((await request(app).get(URL).set('Cookie', cookieDeSesion(roles.COLABORADOR))).status).toBe(403);
            expect(colectivoService.obtenerPotencialesColaboradores).not.toHaveBeenCalled();
        });
    });
});
