jest.mock('../../../src/repositories/colectivoRepository.js', () => ({
    findAll: jest.fn(),
    findByNombre: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
}));
jest.mock('../../../src/services/proyectoService.js', () => ({
    obtenerPorListaId: jest.fn(),
    finalizar: jest.fn(),
}));

const colectivoRepository = require('../../../src/repositories/colectivoRepository.js');
const proyectoService = require('../../../src/services/proyectoService.js');
const colectivoService = require('../../../src/services/colectivoService.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_COLECTIVO = '507f1f77bcf86cd799439051';
const ID_PROY = '507f1f77bcf86cd799439041';

const colectivoDoc = (extra = {}) => ({
    id: ID_COLECTIVO,
    nombre: 'Tech For Good',
    descripcion: 'desc',
    ubicacion: 'Córdoba',
    tipo: 'fundacion',
    proyectos: [],
    ...extra,
});

describe('ColectivoService', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('toDTO', () => {
        test('mapea los campos del colectivo', () => {
            expect(colectivoService.toDTO(colectivoDoc())).toEqual(colectivoDoc());
        });

        test('usa toDTO de los proyectos si lo tienen y lista vacía por defecto', () => {
            expect(colectivoService.toDTO(colectivoDoc({ proyectos: [{ toDTO: () => 'p' }, ID_PROY] })).proyectos)
                .toEqual(['p', ID_PROY]);
            expect(colectivoService.toDTO({ _id: ID_COLECTIVO }).proyectos).toEqual([]);
        });
    });

    describe('obtenerTodos', () => {
        test('devuelve todos los colectivos', async () => {
            colectivoRepository.findAll.mockResolvedValue([colectivoDoc()]);

            await expect(colectivoService.obtenerTodos()).resolves.toHaveLength(1);
        });
    });

    describe('crear', () => {
        const datos = { nombre: 'Tech For Good', tipo: 'fundacion', proyectos: [ID_PROY] };

        test('crea el colectivo validando los proyectos', async () => {
            colectivoRepository.findByNombre.mockResolvedValue(null);
            proyectoService.obtenerPorListaId.mockResolvedValue([{ id: ID_PROY }]);
            colectivoRepository.save.mockResolvedValue(colectivoDoc());

            const resultado = await colectivoService.crear(datos);

            expect(proyectoService.obtenerPorListaId).toHaveBeenCalledWith([ID_PROY]);
            expect(colectivoRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                nombre: 'Tech For Good',
                tipo: 'fundacion',
                proyectos: [ID_PROY],
            }));
            expect(resultado.id).toBe(ID_COLECTIVO);
        });

        test('usa lista vacía si no se envían proyectos', async () => {
            colectivoRepository.findByNombre.mockResolvedValue(null);
            proyectoService.obtenerPorListaId.mockResolvedValue([]);
            colectivoRepository.save.mockResolvedValue(colectivoDoc());

            await colectivoService.crear({ nombre: 'x', tipo: 'ong' });

            expect(proyectoService.obtenerPorListaId).toHaveBeenCalledWith([]);
        });

        test('lanza ConflictError si ya existe uno con ese nombre', async () => {
            colectivoRepository.findByNombre.mockResolvedValue(colectivoDoc());

            await expect(colectivoService.crear(datos)).rejects.toThrow(ConflictError);
            expect(colectivoRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('obtenerPorId', () => {
        test('devuelve el colectivo encontrado', async () => {
            colectivoRepository.findById.mockResolvedValue(colectivoDoc());

            await expect(colectivoService.obtenerPorId(ID_COLECTIVO)).resolves.toMatchObject({ id: ID_COLECTIVO });
        });

        test('lanza BadRequestError con id inválido', async () => {
            await expect(colectivoService.obtenerPorId('malo')).rejects.toThrow(BadRequestError);
        });

        test('lanza NotFoundError si no existe', async () => {
            colectivoRepository.findById.mockResolvedValue(null);

            await expect(colectivoService.obtenerPorId(ID_COLECTIVO)).rejects.toThrow(NotFoundError);
        });
    });

    describe('finalizarProyecto', () => {
        test('verifica el colectivo y finaliza el proyecto', async () => {
            colectivoRepository.findById.mockResolvedValue(colectivoDoc());
            proyectoService.finalizar.mockResolvedValue({ id: ID_PROY, finalizado: true });

            const resultado = await colectivoService.finalizarProyecto(ID_COLECTIVO, ID_PROY);

            expect(proyectoService.finalizar).toHaveBeenCalledWith(ID_PROY);
            expect(resultado.finalizado).toBe(true);
        });

        test('no finaliza si el colectivo no existe', async () => {
            colectivoRepository.findById.mockResolvedValue(null);

            await expect(colectivoService.finalizarProyecto(ID_COLECTIVO, ID_PROY)).rejects.toThrow(NotFoundError);
            expect(proyectoService.finalizar).not.toHaveBeenCalled();
        });
    });
});
