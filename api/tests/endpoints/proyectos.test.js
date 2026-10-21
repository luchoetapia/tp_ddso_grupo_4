jest.mock('../../src/services/proyectoService.js', () => ({
    obtenerTodos: jest.fn(),
    crear: jest.fn(),
    obtenerPorId: jest.fn(),
    buscarPotencialesColaboradores: jest.fn(),
    obtenerPerfiles: jest.fn(),
    perfilPerteneceAProyecto: jest.fn(),
    agregarPerfil: jest.fn(),
    modificarPerfil: jest.fn(),
    eliminarPerfil: jest.fn(),
}));
jest.mock('../../src/services/colectivoService.js', () => ({
    finalizarProyecto: jest.fn(),
}));
jest.mock('../../src/services/notificacionService.js', () => ({
    contactarColaborador: jest.fn(),
}));
jest.mock('../../src/services/logroService.js', () => ({
    obtenerTodos: jest.fn(),
    obtenerPorId: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const proyectoService = require('../../src/services/proyectoService.js');
const colectivoService = require('../../src/services/colectivoService.js');
const notificacionService = require('../../src/services/notificacionService.js');
const logroService = require('../../src/services/logroService.js');
const { ConflictError, NotFoundError } = require('../../src/errors/AppError.js');

const ID = '507f1f77bcf86cd799439041';
const ID_PERFIL = '507f1f77bcf86cd799439031';
const ID_COLECTIVO = '507f1f77bcf86cd799439051';
const ID_LOGRO = '507f1f77bcf86cd799439071';

const proyecto = {
    id: ID, titulo: 'Aula Virtual', descripcion: 'desc', perfiles: [], finalizado: false,
    porcentajeFinalizado: 0, enlaceSistema: null, enlaceCodigoFuente: null, logros: [],
};
const logro = { id: ID_LOGRO, titulo: 'MVP', descripcion: 'Primera versión' };
const ID_HAB = '507f1f77bcf86cd799439021';
const perfil = {
    _id: ID_PERFIL,
    titulo: 'Backend',
    descripcion: 'Backend Node.js',
    habilidadesRequeridas: [],
    habilidadesOpcionales: [],
    tipoCompromiso: { cantHoras: 10, periodo: 'semanal' },
    modalidadColaboracion: { incentivoEconomico: 0, posibleContratacion: false },
};

describe('Endpoints /proyectos', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('GET /proyectos', () => {
        test('devuelve la lista de proyectos', async () => {
            proyectoService.obtenerTodos.mockResolvedValue([proyecto]);

            const res = await request(app).get('/proyectos');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([proyecto]);
        });
    });

    describe('POST /proyectos', () => {
        test('crea el proyecto', async () => {
            proyectoService.crear.mockResolvedValue(proyecto);

            const res = await request(app).post('/proyectos')
                .send({ titulo: 'Aula Virtual', descripcion: 'desc', enlaceSistema: 'https://aula.org' });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: 'Proyecto creado exitosamente', data: proyecto });
            expect(proyectoService.crear).toHaveBeenCalledWith({
                titulo: 'Aula Virtual', descripcion: 'desc', enlaceSistema: 'https://aula.org', perfiles: [],
            });
        });

        test('responde 400 con un enlace inválido', async () => {
            const res = await request(app).post('/proyectos')
                .send({ titulo: 'x', descripcion: 'y', enlaceSistema: 'no-url' });

            expect(res.status).toBe(400);
            expect(proyectoService.crear).not.toHaveBeenCalled();
        });

        test('responde 400 sin título', async () => {
            const res = await request(app).post('/proyectos').send({ descripcion: 'y' });

            expect(res.status).toBe(400);
        });

        test('responde 409 si el título ya existe', async () => {
            proyectoService.crear.mockRejectedValue(new ConflictError('Ya existe un proyecto con ese título'));

            const res = await request(app).post('/proyectos').send({ titulo: 'x', descripcion: 'y' });

            expect(res.status).toBe(409);
        });
    });

    describe('GET /proyectos/:id', () => {
        test('devuelve el proyecto', async () => {
            proyectoService.obtenerPorId.mockResolvedValue(proyecto);

            const res = await request(app).get(`/proyectos/${ID}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(proyecto);
        });

        test('responde 400 con un id inválido', async () => {
            const res = await request(app).get('/proyectos/123');

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Id de proyecto inválido');
        });

        test('responde 404 si no existe', async () => {
            proyectoService.obtenerPorId.mockRejectedValue(new NotFoundError('Proyecto no encontrado'));

            const res = await request(app).get(`/proyectos/${ID}`);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /proyectos/:id/finalizar', () => {
        test('finaliza el proyecto a través del colectivo', async () => {
            colectivoService.finalizarProyecto.mockResolvedValue({ ...proyecto, finalizado: true });

            const res = await request(app).post(`/proyectos/${ID}/finalizar`).send({ idColectivo: ID_COLECTIVO });

            expect(res.status).toBe(200);
            expect(res.body.data.finalizado).toBe(true);
            expect(colectivoService.finalizarProyecto).toHaveBeenCalledWith(ID_COLECTIVO, ID);
        });

        test('responde 400 sin idColectivo', async () => {
            const res = await request(app).post(`/proyectos/${ID}/finalizar`).send({});

            expect(res.status).toBe(400);
            expect(colectivoService.finalizarProyecto).not.toHaveBeenCalled();
        });

        test('responde 404 si el colectivo no existe', async () => {
            colectivoService.finalizarProyecto.mockRejectedValue(new NotFoundError('Colectivo no encontrado'));

            const res = await request(app).post(`/proyectos/${ID}/finalizar`).send({ idColectivo: ID_COLECTIVO });

            expect(res.status).toBe(404);
        });
    });

    describe('perfiles', () => {
        describe('GET /proyectos/:id/perfiles', () => {
            test('devuelve los perfiles del proyecto', async () => {
                proyectoService.obtenerPerfiles.mockResolvedValue([perfil]);

                const res = await request(app).get(`/proyectos/${ID}/perfiles`);

                expect(res.status).toBe(200);
                expect(res.body).toEqual([perfil]);
                expect(proyectoService.obtenerPerfiles).toHaveBeenCalledWith(ID);
            });

            test('responde 400 con id de proyecto inválido', async () => {
                const res = await request(app).get('/proyectos/abc/perfiles');

                expect(res.status).toBe(400);
            });

            test('responde 404 si el proyecto no existe', async () => {
                proyectoService.obtenerPerfiles.mockRejectedValue(new NotFoundError('Proyecto no encontrado'));

                const res = await request(app).get(`/proyectos/${ID}/perfiles`);

                expect(res.status).toBe(404);
            });
        });

        describe('POST /proyectos/:id/perfiles', () => {
            const body = {
                titulo: 'Backend',
                descripcion: 'Backend Node.js',
                habilidadesRequeridas: [ID_HAB],
                tipoCompromiso: { cantHoras: 10, periodo: 'semanal' },
                modalidadColaboracion: {},
            };

            test('crea el perfil aplicando defaults', async () => {
                proyectoService.agregarPerfil.mockResolvedValue(perfil);

                const res = await request(app).post(`/proyectos/${ID}/perfiles`).send(body);

                expect(res.status).toBe(201);
                expect(res.body).toEqual({ message: 'Perfil creado exitosamente', data: perfil });
                expect(proyectoService.agregarPerfil).toHaveBeenCalledWith(ID, {
                    ...body,
                    habilidadesOpcionales: [],
                    modalidadColaboracion: { incentivoEconomico: 0, posibleContratacion: false },
                });
            });

            test('responde 400 sin título', async () => {
                const { titulo, ...sinTitulo } = body;

                const res = await request(app).post(`/proyectos/${ID}/perfiles`).send(sinTitulo);

                expect(res.status).toBe(400);
                expect(proyectoService.agregarPerfil).not.toHaveBeenCalled();
            });

            test('responde 400 sin tipo de compromiso', async () => {
                const res = await request(app).post(`/proyectos/${ID}/perfiles`)
                    .send({ titulo: 'x', descripcion: 'x', modalidadColaboracion: {} });

                expect(res.status).toBe(400);
                expect(proyectoService.agregarPerfil).not.toHaveBeenCalled();
            });

            test('responde 404 si alguna habilidad no existe', async () => {
                proyectoService.agregarPerfil.mockRejectedValue(new NotFoundError('Habilidades no encontradas', [ID_HAB]));

                const res = await request(app).post(`/proyectos/${ID}/perfiles`).send(body);

                expect(res.status).toBe(404);
                expect(res.body.details).toEqual([ID_HAB]);
            });
        });

        describe('GET /proyectos/:id/perfiles/:idPerfil', () => {
            test('devuelve el perfil', async () => {
                proyectoService.perfilPerteneceAProyecto.mockResolvedValue(perfil);

                const res = await request(app).get(`/proyectos/${ID}/perfiles/${ID_PERFIL}`);

                expect(res.status).toBe(200);
                expect(res.body).toEqual(perfil);
                expect(proyectoService.perfilPerteneceAProyecto).toHaveBeenCalledWith(ID, ID_PERFIL);
            });

            test('responde 400 con id de perfil inválido', async () => {
                const res = await request(app).get(`/proyectos/${ID}/perfiles/xyz`);

                expect(res.status).toBe(400);
                expect(res.body.message).toBe('Id de perfil inválido');
            });

            test('responde 404 si el perfil no pertenece al proyecto', async () => {
                proyectoService.perfilPerteneceAProyecto.mockRejectedValue(new NotFoundError('El perfil no pertenece al proyecto especificado'));

                const res = await request(app).get(`/proyectos/${ID}/perfiles/${ID_PERFIL}`);

                expect(res.status).toBe(404);
            });
        });

        describe('PUT /proyectos/:id/perfiles/:idPerfil', () => {
            test('actualiza solo los campos enviados', async () => {
                proyectoService.modificarPerfil.mockResolvedValue({ ...perfil, descripcion: 'Nuevo' });

                const res = await request(app).put(`/proyectos/${ID}/perfiles/${ID_PERFIL}`).send({ descripcion: 'Nuevo' });

                expect(res.status).toBe(200);
                expect(res.body.message).toBe('Perfil actualizado exitosamente');
                expect(res.body.data.descripcion).toBe('Nuevo');
                expect(proyectoService.modificarPerfil).toHaveBeenCalledWith(ID, ID_PERFIL, { descripcion: 'Nuevo' });
            });

            test('responde 400 con body vacío', async () => {
                const res = await request(app).put(`/proyectos/${ID}/perfiles/${ID_PERFIL}`).send({});

                expect(res.status).toBe(400);
                expect(res.body.message).toBe('Debe enviarse al menos un campo para actualizar');
            });

            test('responde 404 si no existe', async () => {
                proyectoService.modificarPerfil.mockRejectedValue(new NotFoundError('Proyecto o perfil no encontrado'));

                const res = await request(app).put(`/proyectos/${ID}/perfiles/${ID_PERFIL}`).send({ descripcion: 'x' });

                expect(res.status).toBe(404);
            });
        });

        describe('DELETE /proyectos/:id/perfiles/:idPerfil', () => {
            test('elimina el perfil', async () => {
                proyectoService.eliminarPerfil.mockResolvedValue();

                const res = await request(app).delete(`/proyectos/${ID}/perfiles/${ID_PERFIL}`);

                expect(res.status).toBe(200);
                expect(res.body).toEqual({ message: 'Perfil eliminado exitosamente' });
                expect(proyectoService.eliminarPerfil).toHaveBeenCalledWith(ID, ID_PERFIL);
            });

            test('responde 404 si no existe', async () => {
                proyectoService.eliminarPerfil.mockRejectedValue(new NotFoundError('Proyecto o perfil no encontrado'));

                const res = await request(app).delete(`/proyectos/${ID}/perfiles/${ID_PERFIL}`);

                expect(res.status).toBe(404);
            });
        });
    });

    describe('GET /proyectos/:id/perfiles/:idPerfil/buscarPotencialesColaboradores', () => {
        const url = `/proyectos/${ID}/perfiles/${ID_PERFIL}/buscarPotencialesColaboradores`;

        test('devuelve los colaboradores que cumplen el perfil', async () => {
            proyectoService.buscarPotencialesColaboradores.mockResolvedValue([{ cuentaGit: 'juanp' }]);

            const res = await request(app).get(url);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ cuentaGit: 'juanp' }]);
            expect(proyectoService.buscarPotencialesColaboradores).toHaveBeenCalledWith(ID, ID_PERFIL);
        });

        test('responde 400 con id de perfil inválido', async () => {
            const res = await request(app).get(`/proyectos/${ID}/perfiles/abc/buscarPotencialesColaboradores`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Id de perfil inválido');
        });

        test('responde 404 si el perfil no pertenece al proyecto', async () => {
            proyectoService.buscarPotencialesColaboradores.mockRejectedValue(new NotFoundError('El perfil no pertenece al proyecto'));

            const res = await request(app).get(url);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /proyectos/:id/perfiles/:idPerfil/contactarColaborador', () => {
        const url = `/proyectos/${ID}/perfiles/${ID_PERFIL}/contactarColaborador`;

        test('contacta al colaborador', async () => {
            const notificacion = { id: 'n1', mensaje: 'Hola' };
            notificacionService.contactarColaborador.mockResolvedValue(notificacion);

            const res = await request(app).post(url).send({ cuentaGit: 'juanp', mensaje: 'Hola' });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: 'Colaborador contactado exitosamente', data: notificacion });
            expect(notificacionService.contactarColaborador).toHaveBeenCalledWith(ID, ID_PERFIL, 'juanp', 'Hola');
        });

        test('responde 400 sin mensaje', async () => {
            const res = await request(app).post(url).send({ cuentaGit: 'juanp' });

            expect(res.status).toBe(400);
        });

        test('responde 409 si el colaborador no acepta ser contactado', async () => {
            notificacionService.contactarColaborador.mockRejectedValue(new ConflictError('El colaborador no acepta ser contactado'));

            const res = await request(app).post(url).send({ cuentaGit: 'juanp', mensaje: 'Hola' });

            expect(res.status).toBe(409);
        });
    });

    describe('Logros', () => {
        describe('GET /proyectos/:id/logros', () => {
            test('devuelve los logros del proyecto', async () => {
                logroService.obtenerTodos.mockResolvedValue([logro]);

                const res = await request(app).get(`/proyectos/${ID}/logros`);

                expect(res.status).toBe(200);
                expect(res.body).toEqual([logro]);
                expect(logroService.obtenerTodos).toHaveBeenCalledWith(ID);
            });

            test('responde 404 si el proyecto no existe', async () => {
                logroService.obtenerTodos.mockRejectedValue(new NotFoundError('Proyecto no encontrado'));

                const res = await request(app).get(`/proyectos/${ID}/logros`);

                expect(res.status).toBe(404);
            });
        });

        describe('POST /proyectos/:id/logros', () => {
            test('crea el logro', async () => {
                logroService.crear.mockResolvedValue(logro);

                const res = await request(app).post(`/proyectos/${ID}/logros`)
                    .send({ titulo: 'MVP', descripcion: 'Primera versión' });

                expect(res.status).toBe(201);
                expect(res.body).toEqual({ message: 'Logro creado exitosamente', data: logro });
                expect(logroService.crear).toHaveBeenCalledWith(ID, { titulo: 'MVP', descripcion: 'Primera versión' });
            });

            test('responde 400 sin descripción', async () => {
                const res = await request(app).post(`/proyectos/${ID}/logros`).send({ titulo: 'MVP' });

                expect(res.status).toBe(400);
                expect(logroService.crear).not.toHaveBeenCalled();
            });
        });

        describe('GET /proyectos/:id/logros/:idLogro', () => {
            test('devuelve el logro', async () => {
                logroService.obtenerPorId.mockResolvedValue(logro);

                const res = await request(app).get(`/proyectos/${ID}/logros/${ID_LOGRO}`);

                expect(res.status).toBe(200);
                expect(res.body).toEqual(logro);
                expect(logroService.obtenerPorId).toHaveBeenCalledWith(ID_LOGRO, ID);
            });

            test('responde 400 con id de logro inválido', async () => {
                const res = await request(app).get(`/proyectos/${ID}/logros/1`);

                expect(res.status).toBe(400);
                expect(res.body.message).toBe('Id de logro inválido');
            });

            test('responde 404 si no existe', async () => {
                logroService.obtenerPorId.mockRejectedValue(new NotFoundError('Logro no encontrado'));

                const res = await request(app).get(`/proyectos/${ID}/logros/${ID_LOGRO}`);

                expect(res.status).toBe(404);
            });
        });

        describe('PUT /proyectos/:id/logros/:idLogro', () => {
            test('actualiza el logro', async () => {
                logroService.actualizar.mockResolvedValue({ ...logro, titulo: 'Editado' });

                const res = await request(app).put(`/proyectos/${ID}/logros/${ID_LOGRO}`).send({ titulo: 'Editado' });

                expect(res.status).toBe(200);
                expect(res.body.data.titulo).toBe('Editado');
                expect(logroService.actualizar).toHaveBeenCalledWith(ID_LOGRO, ID, { titulo: 'Editado' });
            });

            test('responde 400 con campos desconocidos', async () => {
                const res = await request(app).put(`/proyectos/${ID}/logros/${ID_LOGRO}`).send({ otro: 'x' });

                expect(res.status).toBe(400);
            });
        });

        describe('DELETE /proyectos/:id/logros/:idLogro', () => {
            test('elimina el logro', async () => {
                logroService.eliminar.mockResolvedValue({ mensaje: 'Logro eliminado correctamente' });

                const res = await request(app).delete(`/proyectos/${ID}/logros/${ID_LOGRO}`);

                expect(res.status).toBe(200);
                expect(res.body).toEqual({ mensaje: 'Logro eliminado correctamente' });
                expect(logroService.eliminar).toHaveBeenCalledWith(ID_LOGRO, ID);
            });

            test('responde 404 si no existe', async () => {
                logroService.eliminar.mockRejectedValue(new NotFoundError('Logro o proyecto no encontrado'));

                const res = await request(app).delete(`/proyectos/${ID}/logros/${ID_LOGRO}`);

                expect(res.status).toBe(404);
            });
        });
    });

    describe('POST /proyectos/llenarDatosPrueba', () => {
        test('crea un proyecto por defecto con sus perfiles embebidos', async () => {
            proyectoService.crear.mockImplementation(async (datos) => ({ id: ID, ...datos }));

            const res = await request(app).post('/proyectos/llenarDatosPrueba');

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].perfiles.map(p => p.titulo)).toEqual(['Desarrollador Backend', 'Diseñador UX/UI']);
        });

        test('responde 400 si algún elemento es inválido', async () => {
            const res = await request(app).post('/proyectos/llenarDatosPrueba').send([{ titulo: 'Sin descripción' }]);

            expect(res.status).toBe(400);
        });
    });
});
