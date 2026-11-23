jest.mock('../../src/auth/usuarioSemilla.js', () => ({
    crearUsuarioDeSemilla: jest.fn(),
}));
jest.mock('../../src/services/colaboradorService.js', () => ({
    obtenerTodos: jest.fn(),
    crear: jest.fn(),
    obtenerPorCuentaGit: jest.fn(),
}));
jest.mock('../../src/services/colaboracionService.js', () => ({
    crear: jest.fn(),
}));
jest.mock('../../src/services/habilidadService.js', () => ({
    obtenerTodas: jest.fn(),
}));
jest.mock('../../src/services/proyectoService.js', () => ({
    buscarPotencialesProyectos: jest.fn(),
}));
// El middleware auditar() guarda un registro por cada acción exitosa: se mockea para no escribir en la base
jest.mock('../../src/services/auditoriaService.js', () => ({
    registrar: jest.fn().mockResolvedValue(undefined),
}));


const request = require('supertest');
const app = require('../../src/app.js');
const { crearUsuarioDeSemilla } = require('../../src/auth/usuarioSemilla.js');
const { cookieDeSesion, ID_USUARIO } = require('../helpers/sesion.js');
const colaboradorService = require('../../src/services/colaboradorService.js');
const colaboracionService = require('../../src/services/colaboracionService.js');
const habilidadService = require('../../src/services/habilidadService.js');
const proyectoService = require('../../src/services/proyectoService.js');
const notificacionService = require('../../src/services/notificacionService.js');
const { ConflictError, NotFoundError } = require('../../src/errors/AppError.js');
const auditoriaService = require('../../src/services/auditoriaService.js');
const { roles } = require('../../src/auth/models/usuario.js');
const { AccionAuditada } = require('../../src/models/Auditoria.js');

// Anotar directo a un proyecto y cargar datos de prueba es solo para administradores
const admin = cookieDeSesion(roles.ADMIN);

const ID = '507f1f77bcf86cd799439011';
const ID_PROY = '507f1f77bcf86cd799439041';
const ID_HAB = '507f1f77bcf86cd799439021';
const colaborador = {
    id: ID, nombre: 'Juan', apellido: 'Pérez', nombreFantasia: 'Juani', cuentaGit: 'juanp',
    habilidades: [], pronombres: 'él', presentacion: 'Hola', deseaSerContactado: true,
};

// Resultado paginado como lo devuelven los services
const paginaDe = (colaboradores, extra = {}) => ({ colaboradores, total: colaboradores.length, pagina: 1, limite: 10, totalPaginas: 1, ...extra });
const paginacionDefault = { pagina: 1, limite: 10 };

describe('Endpoints /colaboradores', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('GET /colaboradores', () => {
        test('devuelve la lista de colaboradores', async () => {
            colaboradorService.obtenerTodos.mockResolvedValue(paginaDe([colaborador]));

            const res = await request(app).get('/colaboradores');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ data: [colaborador], paginacion: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 } });
            expect(colaboradorService.obtenerTodos).toHaveBeenCalledWith(paginacionDefault);
        });
    });

    describe('POST /colaboradores', () => {
        const body = {
            nombre: 'Juan', apellido: 'Pérez', cuentaGit: 'juanp', habilidades: [ID_HAB],
            contactos: [{ medio: 'Email', valor: 'juan@mail.com' }],
        };

        test('crea el colaborador aplicando defaults', async () => {
            colaboradorService.crear.mockResolvedValue(colaborador);

            const res = await request(app).post('/colaboradores').set('Cookie', cookieDeSesion('colaborador')).send(body);

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: 'Colaboradora creada exitosamente', data: colaborador });
            expect(colaboradorService.crear).toHaveBeenCalledWith({ ...body, deseaSerContactado: false }, ID_USUARIO);
        });

        test('responde 400 con una cuenta de Git inválida', async () => {
            const res = await request(app).post('/colaboradores').set('Cookie', cookieDeSesion('colaborador')).send({ ...body, cuentaGit: 'juan perez!' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Cuenta de Git inválida');
            expect(colaboradorService.crear).not.toHaveBeenCalled();
        });

        test('responde 400 con un medio de contacto inválido', async () => {
            const res = await request(app).post('/colaboradores')
                .set('Cookie', cookieDeSesion('colaborador'))
                .send({ ...body, contactos: [{ medio: 'Fax', valor: '123' }] });

            expect(res.status).toBe(400);
        });

        test('responde 409 si la cuenta de Git ya existe', async () => {
            colaboradorService.crear.mockRejectedValue(new ConflictError('Ya existe un colaborador con esa cuenta de Git'));

            const res = await request(app).post('/colaboradores').set('Cookie', cookieDeSesion('colaborador')).send(body);

            expect(res.status).toBe(409);
        });
    
        test('responde 401 sin sesión', async () => {
            const res = await request(app).post('/colaboradores').send(body);

            expect(res.status).toBe(401);
            expect(colaboradorService.crear).not.toHaveBeenCalled();
        });

        test('responde 403 si el usuario no tiene rol colaborador', async () => {
            const res = await request(app).post('/colaboradores').set('Cookie', cookieDeSesion('colectivo')).send(body);

            expect(res.status).toBe(403);
            expect(colaboradorService.crear).not.toHaveBeenCalled();
        });
    });

    describe('GET /colaboradores/:cuentaGit', () => {
        test('devuelve el colaborador', async () => {
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue(colaborador);

            const res = await request(app).get('/colaboradores/juanp');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(colaborador);
            expect(colaboradorService.obtenerPorCuentaGit).toHaveBeenCalledWith('juanp');
        });

        test('responde 400 con una cuenta de Git inválida', async () => {
            const res = await request(app).get('/colaboradores/juan%20perez');

            expect(res.status).toBe(400);
        });

        test('responde 404 si no existe', async () => {
            colaboradorService.obtenerPorCuentaGit.mockRejectedValue(new NotFoundError('Colaborador no encontrado'));

            const res = await request(app).get('/colaboradores/nadie');

            expect(res.status).toBe(404);
        });
    });

    describe('POST /colaboradores/:cuentaGit/anotarProyecto/:idProyecto', () => {
        test('anota al colaborador en el proyecto', async () => {
            const colaboracion = {
                id: 'c1',
                colaborador: { id: ID, cuentaGit: 'juanp', nombre: 'Juan', apellido: 'Pérez' },
                proyecto: { id: ID_PROY, titulo: 'Aula' },
                inicio: '2024-01-01T00:00:00.000Z', fin: null, esAnonima: false,
            };
            const colaboracionEsperada = {
                id: 'c1',
                colaborador: { nombre: 'Juan', apellido: 'Pérez' },
                proyecto: { id: ID_PROY, titulo: 'Aula' },
                inicio: '2024-01-01T00:00:00.000Z', fin: null, esAnonima: false,
            };
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue(colaborador);
            colaboracionService.crear.mockResolvedValue(colaboracion);

            const res = await request(app).post(`/colaboradores/juanp/anotarProyecto/${ID_PROY}`).set('Cookie', admin);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'Colaboradora anotada al proyecto exitosamente', data: colaboracionEsperada });
            expect(colaboracionService.crear).toHaveBeenCalledWith({ idColaborador: ID, idProyecto: ID_PROY });
            expect(auditoriaService.registrar).toHaveBeenCalledWith(expect.objectContaining({
                accion: AccionAuditada.COLABORACION_CREADA,
                idProyecto: ID_PROY,
                detalle: 'Anotación directa de: juanp',
            }));
        });

        test('responde 403 si no es administrador', async () => {
            const res = await request(app).post(`/colaboradores/juanp/anotarProyecto/${ID_PROY}`).set('Cookie', cookieDeSesion(roles.COLECTIVO));

            expect(res.status).toBe(403);
            expect(colaboracionService.crear).not.toHaveBeenCalled();
        });

        test('responde 400 con id de proyecto inválido', async () => {
            const res = await request(app).post('/colaboradores/juanp/anotarProyecto/123').set('Cookie', admin);

            expect(res.status).toBe(400);
        });

        test('responde 409 si no cumple las habilidades', async () => {
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue(colaborador);
            colaboracionService.crear.mockRejectedValue(new ConflictError('No cumple'));

            const res = await request(app).post(`/colaboradores/juanp/anotarProyecto/${ID_PROY}`).set('Cookie', admin);

            expect(res.status).toBe(409);
        });
    });

    describe('GET /colaboradores/:cuentaGit/buscarPotencialesProyectos', () => {
        test('busca proyectos con las habilidades del colaborador', async () => {
            const ID_HAB = '507f1f77bcf86cd799439021';
            const ID_HAB_2 = '507f1f77bcf86cd799439022';
            // Las habilidades pueden venir populadas o como ids
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue({ cuentaGit: 'juanp', habilidades: [{ _id: ID_HAB }, ID_HAB_2] });
            proyectoService.buscarPotencialesProyectos.mockResolvedValue({
                proyectos: [{ id: ID_PROY }], total: 6, pagina: 2, limite: 5, totalPaginas: 2
            });

            const res = await request(app).get('/colaboradores/juanp/buscarPotencialesProyectos?pagina=2&limite=5');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                data: [{ id: ID_PROY, perfiles: [] }],
                paginacion: { pagina: 2, limite: 5, total: 6, totalPaginas: 2 }
            });
            expect(colaboradorService.obtenerPorCuentaGit).toHaveBeenCalledWith('juanp');
            expect(proyectoService.buscarPotencialesProyectos).toHaveBeenCalledWith([ID_HAB, ID_HAB_2], { pagina: 2, limite: 5 }, {});
        });

        test('responde 400 con un límite inválido', async () => {
            const res = await request(app).get('/colaboradores/juanp/buscarPotencialesProyectos?limite=abc');

            expect(res.status).toBe(400);
            expect(proyectoService.buscarPotencialesProyectos).not.toHaveBeenCalled();
        });

        test('responde 404 si el colaborador no existe', async () => {
            colaboradorService.obtenerPorCuentaGit.mockRejectedValue(new NotFoundError('Colaborador no encontrado'));

            const res = await request(app).get('/colaboradores/nadie/buscarPotencialesProyectos');

            expect(res.status).toBe(404);
            expect(proyectoService.buscarPotencialesProyectos).not.toHaveBeenCalled();
        });
    });


    describe('POST /colaboradores/llenarDatosPrueba', () => {
        test('crea los colaboradores por defecto usando las habilidades existentes', async () => {
            habilidadService.obtenerTodas.mockResolvedValue({ habilidades: [{ id: ID_HAB }] });
            crearUsuarioDeSemilla.mockImplementation(async (cuentaGit) => ({ id: `usr-${cuentaGit}` }));
            colaboradorService.crear.mockImplementation(async (datos) => ({ id: ID, ...datos }));

            const res = await request(app).post('/colaboradores/llenarDatosPrueba').set('Cookie', admin);

            expect(res.status).toBe(201);
            expect(res.body.data.map(c => c.cuentaGit)).toEqual(['juanperez', 'mariagomez']);
            expect(crearUsuarioDeSemilla).toHaveBeenCalledWith('juanperez', 'colaborador');
            expect(colaboradorService.crear).toHaveBeenCalledWith(expect.objectContaining({ habilidades: [ID_HAB] }), 'usr-juanperez');
        });

        test('responde 400 si algún elemento es inválido', async () => {
            const res = await request(app).post('/colaboradores/llenarDatosPrueba').set('Cookie', admin).send([{ nombre: 'Sin apellido' }]);

            expect(res.status).toBe(400);
        });
    });
});
