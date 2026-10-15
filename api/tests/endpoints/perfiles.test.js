jest.mock('../../src/services/perfilService.js', () => ({
    obtenerTodos: jest.fn(),
    obtenerPorId: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app.js');
const perfilService = require('../../src/services/perfilService.js');
const { NotFoundError } = require('../../src/errors/AppError.js');

const ID = '507f1f77bcf86cd799439031';
const ID_HAB = '507f1f77bcf86cd799439021';
const perfil = {
    id: ID,
    descripcion: 'Backend',
    habilidadesRequeridas: [],
    habilidadesOpcionales: [],
    tipoCompromiso: { cantHoras: 10, periodo: 'semanal' },
    modalidadColaboracion: { incentivoEconomico: 0, posibleContratacion: false },
};

describe('Endpoints /perfiles', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => jest.clearAllMocks());

    describe('GET /perfiles', () => {
        test('devuelve la lista de perfiles', async () => {
            perfilService.obtenerTodos.mockResolvedValue([perfil]);

            const res = await request(app).get('/perfiles');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([perfil]);
        });
    });

    describe('POST /perfiles', () => {
        const body = {
            descripcion: 'Backend',
            habilidadesRequeridas: [ID_HAB],
            tipoCompromiso: { cantHoras: 10, periodo: 'semanal' },
            modalidadColaboracion: {},
        };

        test('crea el perfil aplicando defaults', async () => {
            perfilService.crear.mockResolvedValue(perfil);

            const res = await request(app).post('/perfiles').send(body);

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: 'Perfil creado exitosamente', data: perfil });
            expect(perfilService.crear).toHaveBeenCalledWith({
                ...body,
                habilidadesOpcionales: [],
                modalidadColaboracion: { incentivoEconomico: 0, posibleContratacion: false },
            });
        });

        test('responde 400 sin tipo de compromiso', async () => {
            const res = await request(app).post('/perfiles').send({ descripcion: 'x', modalidadColaboracion: {} });

            expect(res.status).toBe(400);
            expect(perfilService.crear).not.toHaveBeenCalled();
        });

        test('responde 404 si alguna habilidad no existe', async () => {
            perfilService.crear.mockRejectedValue(new NotFoundError('Habilidades no encontradas', [ID_HAB]));

            const res = await request(app).post('/perfiles').send(body);

            expect(res.status).toBe(404);
            expect(res.body.details).toEqual([ID_HAB]);
        });
    });

    describe('GET /perfiles/:id', () => {
        test('devuelve el perfil', async () => {
            perfilService.obtenerPorId.mockResolvedValue(perfil);

            const res = await request(app).get(`/perfiles/${ID}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(perfil);
        });

        test('responde 400 con un id inválido', async () => {
            const res = await request(app).get('/perfiles/xyz');

            expect(res.status).toBe(400);
        });

        test('responde 404 si no existe', async () => {
            perfilService.obtenerPorId.mockRejectedValue(new NotFoundError('Perfil no encontrado'));

            const res = await request(app).get(`/perfiles/${ID}`);

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /perfiles/:id', () => {
        test('actualiza solo los campos enviados', async () => {
            perfilService.actualizar.mockResolvedValue({ ...perfil, descripcion: 'Nuevo' });

            const res = await request(app).put(`/perfiles/${ID}`).send({ descripcion: 'Nuevo' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Perfil actualizado exitosamente');
            expect(res.body.data.descripcion).toBe('Nuevo');
            expect(perfilService.actualizar).toHaveBeenCalledWith(ID, { descripcion: 'Nuevo' });
        });

        test('responde 400 con body vacío', async () => {
            const res = await request(app).put(`/perfiles/${ID}`).send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Debe enviarse al menos un campo para actualizar');
        });

        test('responde 400 con id inválido', async () => {
            const res = await request(app).put('/perfiles/123').send({ descripcion: 'x' });

            expect(res.status).toBe(400);
        });

        test('responde 404 si no existe', async () => {
            perfilService.actualizar.mockRejectedValue(new NotFoundError('Perfil no encontrado'));

            const res = await request(app).put(`/perfiles/${ID}`).send({ descripcion: 'x' });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /perfiles/:id', () => {
        test('elimina el perfil', async () => {
            perfilService.eliminar.mockResolvedValue(perfil);

            const res = await request(app).delete(`/perfiles/${ID}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'Perfil eliminado exitosamente' });
            expect(perfilService.eliminar).toHaveBeenCalledWith(ID);
        });

        test('responde 404 si no existe', async () => {
            perfilService.eliminar.mockRejectedValue(new NotFoundError('Perfil no encontrado'));

            const res = await request(app).delete(`/perfiles/${ID}`);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /perfiles/llenarDatosPrueba', () => {
        test('crea los perfiles por defecto', async () => {
            perfilService.crear.mockImplementation(async (datos) => ({ id: ID, ...datos }));

            const res = await request(app).post('/perfiles/llenarDatosPrueba');

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveLength(2);
        });

        test('responde 400 si algún elemento es inválido', async () => {
            const res = await request(app).post('/perfiles/llenarDatosPrueba').send([{ descripcion: 'x' }]);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Datos inválidos en seed de perfil');
        });
    });
});
