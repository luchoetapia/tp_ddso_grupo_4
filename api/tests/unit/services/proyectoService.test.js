jest.mock('../../../src/repositories/proyectoRepository.js', () => ({
    findAll: jest.fn(),
    findByTitulo: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    updateMultiple: jest.fn(),
}));
jest.mock('../../../src/services/perfilService.js', () => ({
    obtenerPorId: jest.fn(),
    perfilesQueCumplenHabilidadesRequeridas: jest.fn(),
}));
jest.mock('../../../src/services/colaboradorService.js', () => ({
    obtenerPorCuentaGit: jest.fn(),
    obtenerTodos: jest.fn(),
}));

const proyectoRepository = require('../../../src/repositories/proyectoRepository.js');
const perfilService = require('../../../src/services/perfilService.js');
const colaboradorService = require('../../../src/services/colaboradorService.js');
const proyectoService = require('../../../src/services/proyectoService.js');
const { Perfil } = require('../../../src/models/proyecto.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_PROY = '507f1f77bcf86cd799439041';
const ID_PROY_2 = '507f1f77bcf86cd799439042';
const ID_PERFIL = '507f1f77bcf86cd799439031';
const ID_PERFIL_2 = '507f1f77bcf86cd799439032';
const ID_HAB = '507f1f77bcf86cd799439021';

const perfil = (id, requeridas = []) => new Perfil(id, 'Perfil', requeridas, [], { cantHoras: 1, periodo: 'total' }, {});

const proyectoDoc = (extra = {}) => ({
    id: ID_PROY,
    _id: { toString: () => extra.id ?? ID_PROY },
    titulo: 'Aula Virtual',
    descripcion: 'desc',
    perfiles: [],
    finalizado: false,
    porcentajeFinalizado: 0,
    enlaceSistema: null,
    enlaceCodigoFuente: null,
    logros: [],
    ...extra,
});

describe('ProyectoService', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('toDTO', () => {
        test('mapea los campos del proyecto', () => {
            expect(proyectoService.toDTO(proyectoDoc())).toEqual({
                id: ID_PROY,
                titulo: 'Aula Virtual',
                descripcion: 'desc',
                perfiles: [],
                finalizado: false,
                porcentajeFinalizado: 0,
                enlaceSistema: null,
                enlaceCodigoFuente: null,
                logros: [],
            });
        });

        test('aplica valores por defecto y usa toDTO de los anidados', () => {
            const dto = proyectoService.toDTO({
                _id: ID_PROY,
                perfiles: [{ toDTO: () => 'perfilDTO' }],
                logros: [{ toDTO: () => 'logroDTO' }],
            });

            expect(dto.finalizado).toBe(false);
            expect(dto.porcentajeFinalizado).toBe(0);
            expect(dto.perfiles).toEqual(['perfilDTO']);
            expect(dto.logros).toEqual(['logroDTO']);
        });
    });

    describe('obtenerTodos', () => {
        test('devuelve todos los proyectos', async () => {
            proyectoRepository.findAll.mockResolvedValue([proyectoDoc()]);

            await expect(proyectoService.obtenerTodos()).resolves.toHaveLength(1);
        });
    });

    describe('crear', () => {
        const datos = { titulo: 'Aula Virtual', descripcion: 'desc', perfiles: [ID_PERFIL] };

        test('crea el proyecto validando sus perfiles', async () => {
            proyectoRepository.findByTitulo.mockResolvedValue(null);
            perfilService.obtenerPorId.mockResolvedValue({ id: ID_PERFIL });
            proyectoRepository.save.mockResolvedValue(proyectoDoc());

            const resultado = await proyectoService.crear(datos);

            expect(perfilService.obtenerPorId).toHaveBeenCalledWith(ID_PERFIL);
            expect(proyectoRepository.save).toHaveBeenCalledWith({
                titulo: 'Aula Virtual',
                descripcion: 'desc',
                perfiles: [ID_PERFIL],
                enlaceSistema: null,
                enlaceCodigoFuente: null,
            });
            expect(resultado.id).toBe(ID_PROY);
        });

        test('usa lista de perfiles vacía si no se envía', async () => {
            proyectoRepository.findByTitulo.mockResolvedValue(null);
            proyectoRepository.save.mockResolvedValue(proyectoDoc());

            await proyectoService.crear({ titulo: 'x', descripcion: 'y' });

            expect(perfilService.obtenerPorId).not.toHaveBeenCalled();
            expect(proyectoRepository.save).toHaveBeenCalledWith(expect.objectContaining({ perfiles: [] }));
        });

        test('lanza ConflictError si ya existe un proyecto con ese título', async () => {
            proyectoRepository.findByTitulo.mockResolvedValue(proyectoDoc());

            await expect(proyectoService.crear(datos)).rejects.toThrow(ConflictError);
            expect(proyectoRepository.save).not.toHaveBeenCalled();
        });

        test('no guarda si algún perfil no existe', async () => {
            proyectoRepository.findByTitulo.mockResolvedValue(null);
            perfilService.obtenerPorId.mockRejectedValue(new NotFoundError('Perfil no encontrado'));

            await expect(proyectoService.crear(datos)).rejects.toThrow(NotFoundError);
            expect(proyectoRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('obtenerPorId', () => {
        test('devuelve el proyecto encontrado', async () => {
            proyectoRepository.findById.mockResolvedValue(proyectoDoc());

            await expect(proyectoService.obtenerPorId(ID_PROY)).resolves.toMatchObject({ id: ID_PROY });
        });

        test('lanza BadRequestError con id inválido', async () => {
            await expect(proyectoService.obtenerPorId('malo')).rejects.toThrow(BadRequestError);
        });

        test('lanza NotFoundError si no existe', async () => {
            proyectoRepository.findById.mockResolvedValue(null);

            await expect(proyectoService.obtenerPorId(ID_PROY)).rejects.toThrow(NotFoundError);
        });
    });

    describe('obtenerPorListaId', () => {
        test('devuelve los proyectos si existen todos', async () => {
            proyectoRepository.findByIds.mockResolvedValue([proyectoDoc()]);

            await expect(proyectoService.obtenerPorListaId([ID_PROY])).resolves.toHaveLength(1);
        });

        test('lanza BadRequestError con los ids inválidos', async () => {
            const error = await proyectoService.obtenerPorListaId(['malo']).catch(e => e);

            expect(error).toBeInstanceOf(BadRequestError);
            expect(error.details).toEqual(['malo']);
        });

        test('lanza NotFoundError con los ids faltantes', async () => {
            proyectoRepository.findByIds.mockResolvedValue([proyectoDoc()]);

            const error = await proyectoService.obtenerPorListaId([ID_PROY, ID_PROY_2]).catch(e => e);

            expect(error).toBeInstanceOf(NotFoundError);
            expect(error.details).toEqual([ID_PROY_2]);
        });
    });

    describe('finalizar', () => {
        test('marca el proyecto como finalizado', async () => {
            proyectoRepository.findById.mockResolvedValue(proyectoDoc());
            proyectoRepository.update.mockResolvedValue(proyectoDoc({ finalizado: true }));

            const resultado = await proyectoService.finalizar(ID_PROY);

            expect(proyectoRepository.update).toHaveBeenCalledWith(ID_PROY, { finalizado: true });
            expect(resultado.finalizado).toBe(true);
        });

        test('lanza NotFoundError si el proyecto no existe', async () => {
            proyectoRepository.findById.mockResolvedValue(null);

            await expect(proyectoService.finalizar(ID_PROY)).rejects.toThrow(NotFoundError);
            expect(proyectoRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('finalizarVariosProyectos', () => {
        test('marca los proyectos como finalizados y devuelve la cantidad modificada', async () => {
            proyectoRepository.updateMultiple.mockResolvedValue({ modifiedCount: 2 });

            const resultado = await proyectoService.finalizarVariosProyectos([ID_PROY, ID_PROY_2]);

            expect(proyectoRepository.updateMultiple).toHaveBeenCalledWith([ID_PROY, ID_PROY_2], { finalizado: true });
            expect(resultado).toBe(2);
        });
    });

    describe('proyectosActivos', () => {
        test('devuelve solo los proyectos no finalizados', async () => {
            proyectoRepository.findAll.mockResolvedValue([
                proyectoDoc({ id: 'activo' }),
                proyectoDoc({ id: 'finalizado', finalizado: true }),
            ]);

            const resultado = await proyectoService.proyectosActivos();

            expect(resultado.map(p => p.id)).toEqual(['activo']);
        });
    });

    describe('buscarPotencialesProyectos', () => {
        test('devuelve proyectos activos con algún perfil que el colaborador cumple', async () => {
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue({ habilidades: [{ _id: ID_HAB }] });
            perfilService.perfilesQueCumplenHabilidadesRequeridas.mockResolvedValue([{ id: ID_PERFIL }]);
            proyectoRepository.findAll.mockResolvedValue([
                proyectoDoc({ id: 'match', perfiles: [perfil(ID_PERFIL)] }),
                proyectoDoc({ id: 'otroPerfil', perfiles: [perfil(ID_PERFIL_2)] }),
                proyectoDoc({ id: 'finalizado', finalizado: true, perfiles: [perfil(ID_PERFIL)] }),
            ]);

            const resultado = await proyectoService.buscarPotencialesProyectos('juanp');

            expect(perfilService.perfilesQueCumplenHabilidadesRequeridas).toHaveBeenCalledWith([ID_HAB]);
            expect(resultado.map(p => p.id)).toEqual(['match']);
        });

        test('propaga NotFoundError si el colaborador no existe', async () => {
            colaboradorService.obtenerPorCuentaGit.mockRejectedValue(new NotFoundError('Colaborador no encontrado'));

            await expect(proyectoService.buscarPotencialesProyectos('nadie')).rejects.toThrow(NotFoundError);
        });
    });

    describe('perfilPerteneceAProyecto', () => {
        test('devuelve el perfil si pertenece al proyecto', async () => {
            const p = perfil(ID_PERFIL);
            proyectoRepository.findById.mockResolvedValue(proyectoDoc({ perfiles: [p] }));

            await expect(proyectoService.perfilPerteneceAProyecto(ID_PROY, ID_PERFIL)).resolves.toBe(p);
        });

        test('lanza NotFoundError si el perfil no pertenece', async () => {
            proyectoRepository.findById.mockResolvedValue(proyectoDoc({ perfiles: [perfil(ID_PERFIL_2)] }));

            await expect(proyectoService.perfilPerteneceAProyecto(ID_PROY, ID_PERFIL)).rejects.toThrow(NotFoundError);
        });
    });

    describe('buscarPotencialesColaboradores', () => {
        test('devuelve los colaboradores que cumplen las habilidades del perfil', async () => {
            proyectoRepository.findById.mockResolvedValue(proyectoDoc({ perfiles: [perfil(ID_PERFIL, [ID_HAB])] }));
            colaboradorService.obtenerTodos.mockResolvedValue([
                { cuentaGit: 'cumple', habilidades: [{ _id: ID_HAB }] },
                { cuentaGit: 'cumpleConId', habilidades: [ID_HAB] },
                { cuentaGit: 'noCumple', habilidades: [] },
            ]);

            const resultado = await proyectoService.buscarPotencialesColaboradores(ID_PROY, ID_PERFIL);

            expect(resultado.map(c => c.cuentaGit)).toEqual(['cumple', 'cumpleConId']);
        });

        test('lanza NotFoundError si el perfil no pertenece al proyecto', async () => {
            proyectoRepository.findById.mockResolvedValue(proyectoDoc());

            await expect(proyectoService.buscarPotencialesColaboradores(ID_PROY, ID_PERFIL)).rejects.toThrow(NotFoundError);
            expect(colaboradorService.obtenerTodos).not.toHaveBeenCalled();
        });
    });
});
