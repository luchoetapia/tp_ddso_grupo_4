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
jest.mock('../../src/services/notificacionService.js', () => ({
    obtenerPorColaborador: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const colaboradorService = require('../../src/services/colaboradorService.js');
const colaboracionService = require('../../src/services/colaboracionService.js');
const habilidadService = require('../../src/services/habilidadService.js');
const proyectoService = require('../../src/services/proyectoService.js');
const notificacionService = require('../../src/services/notificacionService.js');
const { ConflictError, NotFoundError } = require('../../src/errors/AppError.js');

const ID = '507f1f77bcf86cd799439011';
const ID_PROY = '507f1f77bcf86cd799439041';
const ID_HAB = '507f1f77bcf86cd799439021';
const colaborador = {
    id: ID, nombre: 'Juan', apellido: 'Pérez', nombreFantasia: 'Juani', cuentaGit: 'juanp',
    habilidades: [], pronombres: 'él', presentacion: 'Hola', deseaSerContactado: true,
};

describe('Endpoints /colaboradores', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('GET /colaboradores', () => {
        test('devuelve la lista de colaboradores', async () => {
            colaboradorService.obtenerTodos.mockResolvedValue([colaborador]);

            const res = await request(app).get('/colaboradores');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([colaborador]);
        });
    });

    describe('POST /colaboradores', () => {
        const body = {
            nombre: 'Juan', apellido: 'Pérez', cuentaGit: 'juanp', habilidades: [ID_HAB],
            contactos: [{ medio: 'Email', valor: 'juan@mail.com' }],
        };

        test('crea el colaborador aplicando defaults', async () => {
            colaboradorService.crear.mockResolvedValue(colaborador);

            const res = await request(app).post('/colaboradores').send(body);

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: 'Colaboradora creada exitosamente', data: colaborador });
            expect(colaboradorService.crear).toHaveBeenCalledWith({ ...body, deseaSerContactado: false });
        });

        test('responde 400 con una cuenta de Git inválida', async () => {
            const res = await request(app).post('/colaboradores').send({ ...body, cuentaGit: 'juan perez!' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Cuenta de Git inválida');
            expect(colaboradorService.crear).not.toHaveBeenCalled();
        });

        test('responde 400 con un medio de contacto inválido', async () => {
            const res = await request(app).post('/colaboradores')
                .send({ ...body, contactos: [{ medio: 'Fax', valor: '123' }] });

            expect(res.status).toBe(400);
        });

        test('responde 409 si la cuenta de Git ya existe', async () => {
            colaboradorService.crear.mockRejectedValue(new ConflictError('Ya existe un colaborador con esa cuenta de Git'));

            const res = await request(app).post('/colaboradores').send(body);

            expect(res.status).toBe(409);
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
            const colaboracion = { id: 'c1', colaborador: ID, proyecto: ID_PROY };
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue(colaborador);
            colaboracionService.crear.mockResolvedValue(colaboracion);

            const res = await request(app).post(`/colaboradores/juanp/anotarProyecto/${ID_PROY}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'Colaboradora anotada al proyecto exitosamente', data: colaboracion });
            expect(colaboracionService.crear).toHaveBeenCalledWith({ idColaborador: ID, idProyecto: ID_PROY });
        });

        test('responde 400 con id de proyecto inválido', async () => {
            const res = await request(app).post('/colaboradores/juanp/anotarProyecto/123');

            expect(res.status).toBe(400);
        });

        test('responde 409 si no cumple las habilidades', async () => {
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue(colaborador);
            colaboracionService.crear.mockRejectedValue(new ConflictError('No cumple'));

            const res = await request(app).post(`/colaboradores/juanp/anotarProyecto/${ID_PROY}`);

            expect(res.status).toBe(409);
        });
    });

    describe('GET /colaboradores/:cuentaGit/buscarPotencialesProyectos', () => {
        test('busca proyectos con las habilidades del colaborador', async () => {
            const ID_HAB = '507f1f77bcf86cd799439021';
            const ID_HAB_2 = '507f1f77bcf86cd799439022';
            // Las habilidades pueden venir populadas o como ids
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue({ cuentaGit: 'juanp', habilidades: [{ _id: ID_HAB }, ID_HAB_2] });
            proyectoService.buscarPotencialesProyectos.mockResolvedValue([{ id: ID_PROY }]);

            const res = await request(app).get('/colaboradores/juanp/buscarPotencialesProyectos');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ id: ID_PROY }]);
            expect(colaboradorService.obtenerPorCuentaGit).toHaveBeenCalledWith('juanp');
            expect(proyectoService.buscarPotencialesProyectos).toHaveBeenCalledWith([ID_HAB, ID_HAB_2]);
        });

        test('responde 404 si el colaborador no existe', async () => {
            colaboradorService.obtenerPorCuentaGit.mockRejectedValue(new NotFoundError('Colaborador no encontrado'));

            const res = await request(app).get('/colaboradores/nadie/buscarPotencialesProyectos');

            expect(res.status).toBe(404);
            expect(proyectoService.buscarPotencialesProyectos).not.toHaveBeenCalled();
        });
    });

    describe('GET /colaboradores/:cuentaGit/notificaciones', () => {
        test('devuelve las notificaciones del colaborador', async () => {
            notificacionService.obtenerPorColaborador.mockResolvedValue([{ id: 'n1', mensaje: 'Hola' }]);

            const res = await request(app).get('/colaboradores/juanp/notificaciones');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ id: 'n1', mensaje: 'Hola' }]);
        });

        test('responde 404 si el colaborador no existe', async () => {
            notificacionService.obtenerPorColaborador.mockRejectedValue(new NotFoundError('Colaborador no encontrado'));

            const res = await request(app).get('/colaboradores/nadie/notificaciones');

            expect(res.status).toBe(404);
        });
    });

    describe('POST /colaboradores/llenarDatosPrueba', () => {
        test('crea los colaboradores por defecto usando las habilidades existentes', async () => {
            habilidadService.obtenerTodas.mockResolvedValue([{ id: ID_HAB }]);
            colaboradorService.crear.mockImplementation(async (datos) => ({ id: ID, ...datos }));

            const res = await request(app).post('/colaboradores/llenarDatosPrueba');

            expect(res.status).toBe(201);
            expect(res.body.data.map(c => c.cuentaGit)).toEqual(['juanperez', 'mariagomez']);
            expect(colaboradorService.crear).toHaveBeenCalledWith(expect.objectContaining({ habilidades: [ID_HAB] }));
        });

        test('responde 400 si algún elemento es inválido', async () => {
            const res = await request(app).post('/colaboradores/llenarDatosPrueba').send([{ nombre: 'Sin apellido' }]);

            expect(res.status).toBe(400);
        });
    });
});
