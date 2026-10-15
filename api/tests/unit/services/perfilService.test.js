jest.mock('../../../src/repositories/perfilRepository.js', () => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
}));
jest.mock('../../../src/services/habilidadService.js', () => ({
    obtenerPorListaId: jest.fn(),
}));

const perfilRepository = require('../../../src/repositories/perfilRepository.js');
const habilidadService = require('../../../src/services/habilidadService.js');
const perfilService = require('../../../src/services/perfilService.js');
const Perfil = require('../../../src/models/Perfil.js');
const { BadRequestError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_PERFIL = '507f1f77bcf86cd799439031';
const ID_HAB_1 = '507f1f77bcf86cd799439021';
const ID_HAB_2 = '507f1f77bcf86cd799439022';

const tipoCompromiso = { cantHoras: 10, periodo: 'semanal' };
const modalidad = { incentivoEconomico: 0, posibleContratacion: false };
const perfilDoc = (requeridas = [], id = ID_PERFIL) => new Perfil(id, 'Backend', requeridas, [], tipoCompromiso, modalidad);

describe('PerfilService', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('toDTO', () => {
        test('mapea los campos del perfil', () => {
            expect(perfilService.toDTO(perfilDoc([ID_HAB_1]))).toEqual({
                id: ID_PERFIL,
                descripcion: 'Backend',
                habilidadesRequeridas: [ID_HAB_1],
                habilidadesOpcionales: [],
                tipoCompromiso,
                modalidadColaboracion: modalidad,
            });
        });

        test('usa listas vacías si no hay habilidades', () => {
            const dto = perfilService.toDTO({ _id: ID_PERFIL });

            expect(dto.habilidadesRequeridas).toEqual([]);
            expect(dto.habilidadesOpcionales).toEqual([]);
        });
    });

    describe('obtenerTodos', () => {
        test('devuelve todos los perfiles como DTO', async () => {
            perfilRepository.findAll.mockResolvedValue([perfilDoc()]);

            await expect(perfilService.obtenerTodos()).resolves.toHaveLength(1);
        });
    });

    describe('obtenerPorId', () => {
        test('devuelve el perfil encontrado', async () => {
            perfilRepository.findById.mockResolvedValue(perfilDoc());

            await expect(perfilService.obtenerPorId(ID_PERFIL)).resolves.toMatchObject({ id: ID_PERFIL });
        });

        test('lanza BadRequestError con id inválido', async () => {
            await expect(perfilService.obtenerPorId('malo')).rejects.toThrow(BadRequestError);
        });

        test('lanza NotFoundError si no existe', async () => {
            perfilRepository.findById.mockResolvedValue(null);

            await expect(perfilService.obtenerPorId(ID_PERFIL)).rejects.toThrow(NotFoundError);
        });
    });

    describe('crear', () => {
        test('valida habilidades requeridas y opcionales antes de guardar', async () => {
            const datos = {
                descripcion: 'Backend',
                habilidadesRequeridas: [ID_HAB_1],
                habilidadesOpcionales: [ID_HAB_2],
                tipoCompromiso,
                modalidadColaboracion: modalidad,
            };
            habilidadService.obtenerPorListaId.mockResolvedValue([]);
            perfilRepository.save.mockResolvedValue(perfilDoc());

            const resultado = await perfilService.crear(datos);

            expect(habilidadService.obtenerPorListaId).toHaveBeenCalledWith([ID_HAB_1]);
            expect(habilidadService.obtenerPorListaId).toHaveBeenCalledWith([ID_HAB_2]);
            expect(perfilRepository.save).toHaveBeenCalledWith(datos);
            expect(resultado.id).toBe(ID_PERFIL);
        });

        test('no valida habilidades si las listas están vacías', async () => {
            perfilRepository.save.mockResolvedValue(perfilDoc());

            await perfilService.crear({ descripcion: 'x', habilidadesRequeridas: [], habilidadesOpcionales: [] });

            expect(habilidadService.obtenerPorListaId).not.toHaveBeenCalled();
        });

        test('no guarda si alguna habilidad no existe', async () => {
            habilidadService.obtenerPorListaId.mockRejectedValue(new NotFoundError('Habilidades no encontradas'));

            await expect(perfilService.crear({ habilidadesRequeridas: [ID_HAB_1] })).rejects.toThrow(NotFoundError);
            expect(perfilRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('crearVarios', () => {
        test('crea cada perfil de la lista en orden', async () => {
            perfilRepository.save
                .mockResolvedValueOnce(perfilDoc([], 'a'))
                .mockResolvedValueOnce(perfilDoc([], 'b'));

            const resultado = await perfilService.crearVarios([{ descripcion: 'a' }, { descripcion: 'b' }]);

            expect(resultado.map(p => p.id)).toEqual(['a', 'b']);
            expect(perfilRepository.save).toHaveBeenCalledTimes(2);
        });
    });

    describe('actualizar', () => {
        test('actualiza un perfil existente', async () => {
            perfilRepository.findById.mockResolvedValue(perfilDoc());
            perfilRepository.update.mockResolvedValue(new Perfil(ID_PERFIL, 'Nuevo', [], [], tipoCompromiso, modalidad));

            const resultado = await perfilService.actualizar(ID_PERFIL, { descripcion: 'Nuevo' });

            expect(perfilRepository.update).toHaveBeenCalledWith(ID_PERFIL, { descripcion: 'Nuevo' });
            expect(resultado.descripcion).toBe('Nuevo');
        });

        test('lanza NotFoundError si el perfil no existe', async () => {
            perfilRepository.findById.mockResolvedValue(null);

            await expect(perfilService.actualizar(ID_PERFIL, {})).rejects.toThrow(NotFoundError);
            expect(perfilRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('eliminar', () => {
        test('elimina un perfil existente', async () => {
            perfilRepository.findById.mockResolvedValue(perfilDoc());
            perfilRepository.delete.mockResolvedValue(perfilDoc());

            await perfilService.eliminar(ID_PERFIL);

            expect(perfilRepository.delete).toHaveBeenCalledWith(ID_PERFIL);
        });

        test('lanza NotFoundError si el perfil no existe', async () => {
            perfilRepository.findById.mockResolvedValue(null);

            await expect(perfilService.eliminar(ID_PERFIL)).rejects.toThrow(NotFoundError);
            expect(perfilRepository.delete).not.toHaveBeenCalled();
        });
    });

    describe('perfilesQueCumplenHabilidadesRequeridas', () => {
        test('filtra los perfiles cuyas habilidades requeridas se cumplen', async () => {
            const cumple = perfilDoc([ID_HAB_1], 'cumple');
            const noCumple = perfilDoc([ID_HAB_1, ID_HAB_2], 'noCumple');
            const sinRequisitos = perfilDoc([], 'sinRequisitos');
            perfilRepository.findAll.mockResolvedValue([cumple, noCumple, sinRequisitos]);

            const resultado = await perfilService.perfilesQueCumplenHabilidadesRequeridas([ID_HAB_1]);

            expect(resultado.map(p => p.id)).toEqual(['cumple', 'sinRequisitos']);
        });
    });
});
