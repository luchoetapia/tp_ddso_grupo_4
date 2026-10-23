jest.mock('../../../src/repositories/colaboracionRepository.js', () => ({
    findAll: jest.fn(),
    findActiva: jest.fn(),
    save: jest.fn(),
}));
jest.mock('../../../src/services/proyectoService.js', () => ({
    obtenerPorId: jest.fn(),
}));
jest.mock('../../../src/services/colaboradorService.js', () => ({
    obtenerPorId: jest.fn(),
}));

const colaboracionRepository = require('../../../src/repositories/colaboracionRepository.js');
const proyectoService = require('../../../src/services/proyectoService.js');
const colaboradorService = require('../../../src/services/colaboradorService.js');
const colaboracionService = require('../../../src/services/colaboracionService.js');
const { Perfil } = require('../../../src/models/proyecto.js');
const { ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

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
});
