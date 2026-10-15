jest.mock('../../../src/repositories/habilidadRepository.js', () => ({
    findAll: jest.fn(),
    findByTitulo: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    save: jest.fn(),
}));

const habilidadRepository = require('../../../src/repositories/habilidadRepository.js');
const habilidadService = require('../../../src/services/habilidadService.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_1 = '507f1f77bcf86cd799439011';
const ID_2 = '507f1f77bcf86cd799439012';

const habilidadDoc = (id, titulo = 'JS') => ({
    id,
    _id: { toString: () => id },
    titulo,
    tipoHabilidad: 'programacion',
    descripcion: 'desc',
});

describe('HabilidadService', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('toDTO', () => {
        test('mapea los campos de la habilidad', () => {
            expect(habilidadService.toDTO(habilidadDoc(ID_1))).toEqual({
                id: ID_1, titulo: 'JS', tipoHabilidad: 'programacion', descripcion: 'desc',
            });
        });

        test('usa _id si no hay id', () => {
            expect(habilidadService.toDTO({ _id: ID_1 }).id).toBe(ID_1);
        });
    });

    describe('obtenerTodas', () => {
        test('devuelve todas las habilidades como DTO', async () => {
            habilidadRepository.findAll.mockResolvedValue([habilidadDoc(ID_1), habilidadDoc(ID_2, 'Node')]);

            const resultado = await habilidadService.obtenerTodas();

            expect(resultado).toHaveLength(2);
            expect(resultado.map(h => h.titulo)).toEqual(['JS', 'Node']);
        });
    });

    describe('crear', () => {
        const datos = { titulo: 'JS', tipoHabilidad: 'programacion', descripcion: 'desc' };

        test('crea la habilidad si no existe otra con el mismo título', async () => {
            habilidadRepository.findByTitulo.mockResolvedValue(null);
            habilidadRepository.save.mockResolvedValue(habilidadDoc(ID_1));

            const resultado = await habilidadService.crear(datos);

            expect(habilidadRepository.save).toHaveBeenCalledWith(datos);
            expect(resultado.id).toBe(ID_1);
        });

        test('lanza ConflictError si ya existe una con ese título', async () => {
            habilidadRepository.findByTitulo.mockResolvedValue(habilidadDoc(ID_1));

            await expect(habilidadService.crear(datos)).rejects.toThrow(ConflictError);
            expect(habilidadRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('obtenerPorId', () => {
        test('devuelve la habilidad encontrada', async () => {
            habilidadRepository.findById.mockResolvedValue(habilidadDoc(ID_1));

            await expect(habilidadService.obtenerPorId(ID_1)).resolves.toMatchObject({ id: ID_1 });
        });

        test('lanza BadRequestError con un id inválido', async () => {
            await expect(habilidadService.obtenerPorId('invalido')).rejects.toThrow(BadRequestError);
            expect(habilidadRepository.findById).not.toHaveBeenCalled();
        });

        test('lanza NotFoundError si no existe', async () => {
            habilidadRepository.findById.mockResolvedValue(null);

            await expect(habilidadService.obtenerPorId(ID_1)).rejects.toThrow(NotFoundError);
        });
    });

    describe('obtenerPorListaId', () => {
        test('devuelve las habilidades si existen todas', async () => {
            habilidadRepository.findByIds.mockResolvedValue([habilidadDoc(ID_1), habilidadDoc(ID_2)]);

            const resultado = await habilidadService.obtenerPorListaId([ID_1, ID_2]);

            expect(resultado.map(h => h.id)).toEqual([ID_1, ID_2]);
        });

        test('devuelve lista vacía si no se piden ids', async () => {
            habilidadRepository.findByIds.mockResolvedValue([]);

            await expect(habilidadService.obtenerPorListaId([])).resolves.toEqual([]);
        });

        test('lanza BadRequestError con los ids inválidos', async () => {
            const error = await habilidadService.obtenerPorListaId([ID_1, 'malo']).catch(e => e);

            expect(error).toBeInstanceOf(BadRequestError);
            expect(error.details).toEqual(['malo']);
        });

        test('lanza NotFoundError con los ids faltantes', async () => {
            habilidadRepository.findByIds.mockResolvedValue([habilidadDoc(ID_1)]);

            const error = await habilidadService.obtenerPorListaId([ID_1, ID_2]).catch(e => e);

            expect(error).toBeInstanceOf(NotFoundError);
            expect(error.details).toEqual([ID_2]);
        });
    });
});
