jest.mock('../../../src/repositories/colaboracionRepository.js', () => ({
    findAll: jest.fn(),
    findActiva: jest.fn(),
    findById: jest.fn(),
    cerrar: jest.fn(),
    save: jest.fn(),
}));
jest.mock('../../../src/services/proyectoService.js', () => ({
    obtenerPorId: jest.fn(),
}));
jest.mock('../../../src/services/colaboradorService.js', () => ({
    obtenerPorId: jest.fn(),
    buscarPorUsuario: jest.fn(),
}));
jest.mock('../../../src/services/colectivoService.js', () => ({ 
    buscarPorUsuario: jest.fn() 
}));

const colectivoService = require('../../../src/services/colectivoService.js');
const { Colaboracion } = require('../../../src/models/colaboracion.js');
const { roles } = require('../../../src/auth/models/usuario.js');
const { ConflictError, ForbiddenError, NotFoundError } = require('../../../src/errors/AppError.js');
const ID_USUARIO = '507f1f77bcf86cd7994390aa';

const colaboracionRepository = require('../../../src/repositories/colaboracionRepository.js');
const proyectoService = require('../../../src/services/proyectoService.js');
const colaboradorService = require('../../../src/services/colaboradorService.js');
const colaboracionService = require('../../../src/services/colaboracionService.js');
const { Perfil } = require('../../../src/models/proyecto.js');


const ID_PROY = '507f1f77bcf86cd799439041';
const ID_COLAB = '507f1f77bcf86cd799439011';
const ID_HAB = '507f1f77bcf86cd799439021';
const ID_COLABORACION = '507f1f77bcf86cd799439061';

const perfil = (requeridas) => new Perfil('perfil', 'Perfil', 'desc', requeridas, [], {}, {});

describe('ColaboracionService', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('obtenerTodas', () => {
        test('devuelve todas las colaboraciones', async () => {
            colaboracionRepository.findAll.mockResolvedValue([{ id: ID_COLABORACION }]);

            await expect(colaboracionService.obtenerTodas()).resolves.toHaveLength(1);
        });
    });

    describe('crear', () => {
        const datos = { idProyecto: ID_PROY, idColaborador: ID_COLAB };

        const prepararEscenario = ({ finalizado = false, requeridas = [ID_HAB], habilidades = [{ _id: ID_HAB }], activa = null } = {}) => {
            proyectoService.obtenerPorId.mockResolvedValue({ id: ID_PROY, finalizado, perfiles: [perfil(requeridas)] });
            colaboradorService.obtenerPorId.mockResolvedValue({ id: ID_COLAB, habilidades });
            colaboracionRepository.findActiva.mockResolvedValue(activa);
        };

        test('crea la colaboración si el colaborador cumple algún perfil', async () => {
            prepararEscenario();
            colaboracionRepository.save.mockImplementation(async (c) => ({ id: ID_COLABORACION, ...c, fin: null, esAnonima: false }));

            const resultado = await colaboracionService.crear(datos);

            expect(colaboracionRepository.findActiva).toHaveBeenCalledWith(ID_COLAB, ID_PROY);
            expect(colaboracionRepository.save).toHaveBeenCalledWith({
                colaborador: ID_COLAB,
                proyecto: ID_PROY,
                inicio: expect.any(Date),
            });
            expect(resultado).toMatchObject({ id: ID_COLABORACION, colaborador: ID_COLAB, proyecto: ID_PROY });
        });

        test('lanza ConflictError si el proyecto está finalizado', async () => {
            prepararEscenario({ finalizado: true });

            await expect(colaboracionService.crear(datos)).rejects.toThrow(ConflictError);
            expect(colaboracionRepository.save).not.toHaveBeenCalled();
        });

        test('lanza ConflictError si no cumple las habilidades de ningún perfil', async () => {
            prepararEscenario({ habilidades: [] });

            await expect(colaboracionService.crear(datos)).rejects.toThrow(/no cumple/);
            expect(colaboracionRepository.save).not.toHaveBeenCalled();
        });

        test('lanza ConflictError si ya está anotada en el proyecto', async () => {
            prepararEscenario({ activa: { id: 'existente' } });

            await expect(colaboracionService.crear(datos)).rejects.toThrow(/ya está anotada/);
            expect(colaboracionRepository.save).not.toHaveBeenCalled();
        });

        test('propaga NotFoundError si el proyecto no existe', async () => {
            proyectoService.obtenerPorId.mockRejectedValue(new NotFoundError('Proyecto no encontrado'));

            await expect(colaboracionService.crear(datos)).rejects.toThrow(NotFoundError);
        });
    });

    describe('desanotar', () => {
    const colaboracion = (fin = null) => Object.assign(
        new Colaboracion(), { id: ID_COLABORACION, colaborador: { id: ID_COLAB }, proyecto: { id: ID_PROY }, inicio: new Date(), fin }
    );
    const sesionColaborador = { id: ID_USUARIO, rol: roles.COLABORADOR };
    const sesionColectivo = { id: ID_USUARIO, rol: roles.COLECTIVO };

        test('la propia colaboradora se da de baja: se cierra la colaboración con fecha de fin', async () => {
            colaboracionRepository.findById.mockResolvedValue(colaboracion());
            colaboradorService.buscarPorUsuario.mockResolvedValue({ id: ID_COLAB });
            colaboracionRepository.cerrar.mockImplementation(async (id, fin) => ({ id, fin }));

        const resultado = await colaboracionService.desanotar(ID_COLABORACION, sesionColaborador);

        expect(colaboracionRepository.cerrar).toHaveBeenCalledWith(ID_COLABORACION, expect.any(Date));
        expect(resultado.fin).toBeInstanceOf(Date);
    });

    test('el colectivo dueño del proyecto puede desasociar a la colaboradora', async () => {
        colaboracionRepository.findById.mockResolvedValue(colaboracion());
        colectivoService.buscarPorUsuario.mockResolvedValue({ proyectos: [{ _id: ID_PROY }] });
        colaboracionRepository.cerrar.mockResolvedValue({ id: ID_COLABORACION });

        await colaboracionService.desanotar(ID_COLABORACION, sesionColectivo);

        expect(colaboracionRepository.cerrar).toHaveBeenCalledWith(ID_COLABORACION, expect.any(Date));
    });

    test('lanza NotFoundError si la colaboración no existe', async () => {
        colaboracionRepository.findById.mockResolvedValue(null);

        await expect(colaboracionService.desanotar(ID_COLABORACION, sesionColaborador)).rejects.toThrow(NotFoundError);
    });

    test('lanza ConflictError si la colaboración ya fue dada de baja', async () => {
        colaboracionRepository.findById.mockResolvedValue(colaboracion(new Date()));
        colaboradorService.buscarPorUsuario.mockResolvedValue({ id: ID_COLAB });

        await expect(colaboracionService.desanotar(ID_COLABORACION, sesionColaborador)).rejects.toThrow(/ya fue dada de baja/);
        expect(colaboracionRepository.cerrar).not.toHaveBeenCalled();
    });

    test('lanza ConflictError si otro pedido la cerró en el medio (cierre atómico)', async () => {
        colaboracionRepository.findById.mockResolvedValue(colaboracion());
        colaboradorService.buscarPorUsuario.mockResolvedValue({ id: ID_COLAB });
        colaboracionRepository.cerrar.mockResolvedValue(null);

        await expect(colaboracionService.desanotar(ID_COLABORACION, sesionColaborador)).rejects.toThrow(ConflictError);
    });

    test('a quien no tiene permiso no se le revela si ya estaba dada de baja', async () => {
        colaboracionRepository.findById.mockResolvedValue(colaboracion(new Date()));
        colaboradorService.buscarPorUsuario.mockResolvedValue({ id: 'otra-persona' });

        await expect(colaboracionService.desanotar(ID_COLABORACION, sesionColaborador)).rejects.toThrow(ForbiddenError);
    });

    test('lanza ForbiddenError si la referencia al colaborador está rota', async () => {
        colaboracionRepository.findById.mockResolvedValue({ ...colaboracion(), colaborador: null, estaActiva: () => true });
        colaboradorService.buscarPorUsuario.mockResolvedValue({ id: ID_COLAB });

        await expect(colaboracionService.desanotar(ID_COLABORACION, sesionColaborador)).rejects.toThrow(ForbiddenError);
    });

    test('lanza ForbiddenError si otra colaboradora intenta darla de baja', async () => {
        colaboracionRepository.findById.mockResolvedValue(colaboracion());
        colaboradorService.buscarPorUsuario.mockResolvedValue({ id: 'otra-persona' });

        await expect(colaboracionService.desanotar(ID_COLABORACION, sesionColaborador)).rejects.toThrow(ForbiddenError);
        expect(colaboracionRepository.cerrar).not.toHaveBeenCalled();
    });

    test('lanza ForbiddenError si el colectivo no es dueño del proyecto', async () => {
        colaboracionRepository.findById.mockResolvedValue(colaboracion());
        colectivoService.buscarPorUsuario.mockResolvedValue({ proyectos: [{ _id: 'otro-proyecto' }] });

        await expect(colaboracionService.desanotar(ID_COLABORACION, sesionColectivo)).rejects.toThrow(ForbiddenError);
        expect(colaboracionRepository.cerrar).not.toHaveBeenCalled();
    });

    test('lanza ForbiddenError si el usuario no tiene colectivo asociado', async () => {
        colaboracionRepository.findById.mockResolvedValue(colaboracion());
        colectivoService.buscarPorUsuario.mockResolvedValue(null);

        await expect(colaboracionService.desanotar(ID_COLABORACION, sesionColectivo)).rejects.toThrow(ForbiddenError);
    });
    });
});
