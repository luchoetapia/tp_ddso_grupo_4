jest.mock('../../../src/repositories/colaboradorRepository.js', () => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCuentaGit: jest.fn(),
    save: jest.fn(),
}));
jest.mock('../../../src/services/habilidadService.js', () => ({
    obtenerPorListaId: jest.fn(),
}));

const colaboradorRepository = require('../../../src/repositories/colaboradorRepository.js');
const habilidadService = require('../../../src/services/habilidadService.js');
const colaboradorService = require('../../../src/services/colaboradorService.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_COLAB = '507f1f77bcf86cd799439011';
const ID_HAB = '507f1f77bcf86cd799439021';

const colaboradorDoc = (extra = {}) => ({
    id: ID_COLAB,
    nombre: 'Juan',
    apellido: 'Pérez',
    nombreFantasia: 'Juani',
    cuentaGit: 'juanp',
    habilidades: [],
    pronombres: 'él',
    presentacion: 'Hola',
    deseaSerContactado: true,
    contactos: [],
    ...extra,
});

describe('ColaboradorService', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('toDTO', () => {
        test('mapea los campos y no expone los contactos', () => {
            const dto = colaboradorService.toDTO(colaboradorDoc({ contactos: [{ medio: 'Email', valor: 'x' }] }));

            expect(dto).toEqual({
                id: ID_COLAB,
                nombre: 'Juan',
                apellido: 'Pérez',
                nombreFantasia: 'Juani',
                cuentaGit: 'juanp',
                habilidades: [],
                pronombres: 'él',
                presentacion: 'Hola',
                deseaSerContactado: true,
            });
        });

        test('usa toDTO de las habilidades si lo tienen', () => {
            const habilidad = { toDTO: () => ({ id: ID_HAB, titulo: 'JS' }) };

            const dto = colaboradorService.toDTO(colaboradorDoc({ habilidades: [habilidad, 'idPlano'] }));

            expect(dto.habilidades).toEqual([{ id: ID_HAB, titulo: 'JS' }, 'idPlano']);
        });

        test('deseaSerContactado es false y habilidades vacías por defecto', () => {
            const dto = colaboradorService.toDTO({ _id: ID_COLAB });

            expect(dto.deseaSerContactado).toBe(false);
            expect(dto.habilidades).toEqual([]);
        });
    });

    describe('obtenerTodos', () => {
        test('devuelve todos los colaboradores como DTO', async () => {
            colaboradorRepository.findAll.mockResolvedValue([colaboradorDoc()]);

            const resultado = await colaboradorService.obtenerTodos();

            expect(resultado).toHaveLength(1);
            expect(resultado[0].cuentaGit).toBe('juanp');
        });
    });

    describe('crear', () => {
        const datos = { nombre: 'Juan', apellido: 'Pérez', cuentaGit: 'juanp', habilidades: [ID_HAB] };

        test('crea el colaborador validando sus habilidades', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(null);
            habilidadService.obtenerPorListaId.mockResolvedValue([{ id: ID_HAB }]);
            colaboradorRepository.save.mockResolvedValue(colaboradorDoc());

            const resultado = await colaboradorService.crear(datos);

            expect(habilidadService.obtenerPorListaId).toHaveBeenCalledWith([ID_HAB]);
            expect(colaboradorRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                cuentaGit: 'juanp',
                habilidades: [ID_HAB],
                deseaSerContactado: false,
                contactos: [],
            }));
            expect(resultado.id).toBe(ID_COLAB);
        });

        test('usa lista vacía si no se envían habilidades', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(null);
            habilidadService.obtenerPorListaId.mockResolvedValue([]);
            colaboradorRepository.save.mockResolvedValue(colaboradorDoc());

            await colaboradorService.crear({ nombre: 'J', apellido: 'P', cuentaGit: 'jp' });

            expect(habilidadService.obtenerPorListaId).toHaveBeenCalledWith([]);
        });

        test('lanza ConflictError si la cuenta de Git ya existe', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(colaboradorDoc());

            await expect(colaboradorService.crear(datos)).rejects.toThrow(ConflictError);
            expect(colaboradorRepository.save).not.toHaveBeenCalled();
        });

        test('propaga el error si alguna habilidad no existe', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(null);
            habilidadService.obtenerPorListaId.mockRejectedValue(new NotFoundError('Habilidades no encontradas'));

            await expect(colaboradorService.crear(datos)).rejects.toThrow(NotFoundError);
            expect(colaboradorRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('obtenerPorId', () => {
        test('devuelve el colaborador encontrado', async () => {
            colaboradorRepository.findById.mockResolvedValue(colaboradorDoc());

            await expect(colaboradorService.obtenerPorId(ID_COLAB)).resolves.toMatchObject({ id: ID_COLAB });
        });

        test('lanza BadRequestError con id inválido', async () => {
            await expect(colaboradorService.obtenerPorId('malo')).rejects.toThrow(BadRequestError);
        });

        test('lanza NotFoundError si no existe', async () => {
            colaboradorRepository.findById.mockResolvedValue(null);

            await expect(colaboradorService.obtenerPorId(ID_COLAB)).rejects.toThrow(NotFoundError);
        });
    });

    describe('obtenerPorCuentaGit', () => {
        test('devuelve el colaborador encontrado', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(colaboradorDoc());

            await expect(colaboradorService.obtenerPorCuentaGit('juanp')).resolves.toMatchObject({ cuentaGit: 'juanp' });
            expect(colaboradorRepository.findByCuentaGit).toHaveBeenCalledWith('juanp');
        });

        test('lanza NotFoundError si no existe', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(null);

            await expect(colaboradorService.obtenerPorCuentaGit('nadie')).rejects.toThrow(NotFoundError);
        });
    });

    describe('obtenerContactos', () => {
        test('devuelve solo medio y valor de cada contacto', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(colaboradorDoc({
                contactos: [{ _id: 'x', medio: 'Email', valor: 'a@b.com' }],
            }));

            await expect(colaboradorService.obtenerContactos('juanp'))
                .resolves.toEqual([{ medio: 'Email', valor: 'a@b.com' }]);
        });

        test('lanza NotFoundError si no existe', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(null);

            await expect(colaboradorService.obtenerContactos('nadie')).rejects.toThrow(NotFoundError);
        });
    });
});
