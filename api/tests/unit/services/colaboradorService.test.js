jest.mock('../../../src/repositories/colaboradorRepository.js', () => ({
    buscarConPaginacion: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCuentaGit: jest.fn(),
    findByUsuario: jest.fn(),
    save: jest.fn(),
}));
jest.mock('../../../src/services/habilidadService.js', () => ({
    obtenerPorListaId: jest.fn(),
}));
jest.mock('../../../src/repositories/colectivoRepository.js', () => ({
    findByUsuario: jest.fn(),
}));
jest.mock('../../../src/repositories/postulacionRepository.js', () => ({
    existeAceptadaEnProyectos: jest.fn(),
}));
const colectivoRepository = require('../../../src/repositories/colectivoRepository.js');
const postulacionRepository = require('../../../src/repositories/postulacionRepository.js');
const { ForbiddenError } = require('../../../src/errors/AppError.js');

const colaboradorRepository = require('../../../src/repositories/colaboradorRepository.js');
const habilidadService = require('../../../src/services/habilidadService.js');
const colaboradorService = require('../../../src/services/colaboradorService.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_COLAB = '507f1f77bcf86cd799439011';
const ID_HAB = '507f1f77bcf86cd799439021';
const ID_USUARIO = '507f1f77bcf86cd7994390aa';

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

    describe('obtenerTodos', () => {
        test('pagina en la BD, por defecto alfabético por cuenta de Git', async () => {
            const pagina = { colaboradores: [colaboradorDoc()], total: 1, pagina: 1, limite: 10, totalPaginas: 1 };
            colaboradorRepository.buscarConPaginacion.mockResolvedValue(pagina);

            await expect(colaboradorService.obtenerTodos({ pagina: 1, limite: 10 })).resolves.toBe(pagina);
            expect(colaboradorRepository.buscarConPaginacion).toHaveBeenCalledWith(1, 10, {}, { cuentaGit: 1, _id: 1 });
        });

        test('ordena por la clave elegida y desempata por cuenta de Git e id', async () => {
            colaboradorRepository.buscarConPaginacion.mockResolvedValue({ colaboradores: [] });

            await colaboradorService.obtenerTodos({ orden: 'nombre', direccion: 'desc' });

            expect(colaboradorRepository.buscarConPaginacion).toHaveBeenCalledWith(undefined, undefined, {}, { nombre: -1, cuentaGit: 1, _id: 1 });
        });

        test('rechaza una clave de orden que no existe', async () => {
            await expect(colaboradorService.obtenerTodos({ orden: 'contactos' })).rejects.toThrow(BadRequestError);
            expect(colaboradorRepository.buscarConPaginacion).not.toHaveBeenCalled();
        });
    });

    describe('obtenerColaboradoresPotenciales', () => {
        const ID_HAB_2 = '507f1f77bcf86cd799439022';

        test('pagina en la BD con quienes tienen todas las requeridas de algún perfil', async () => {
            colaboradorRepository.buscarConPaginacion.mockResolvedValue({ colaboradores: [] });
            const perfiles = [
                { habilidadesRequeridas: [{ _id: ID_HAB }, { _id: ID_HAB_2 }] },
                { habilidadesRequeridas: [{ _id: ID_HAB_2 }] },
            ];

            await colaboradorService.obtenerColaboradoresPotenciales(perfiles, { pagina: 3, limite: 5 });

            expect(colaboradorRepository.buscarConPaginacion).toHaveBeenCalledWith(3, 5, {
                $or: [
                    { habilidades: { $all: [ID_HAB, ID_HAB_2] } },
                    { habilidades: { $all: [ID_HAB_2] } },
                ]
            }, { cuentaGit: 1, _id: 1 });
        });

        test('sin habilidades requeridas no filtra', async () => {
            colaboradorRepository.buscarConPaginacion.mockResolvedValue({ colaboradores: [] });

            await colaboradorService.obtenerColaboradoresPotenciales([{ habilidadesRequeridas: [] }]);

            expect(colaboradorRepository.buscarConPaginacion).toHaveBeenCalledWith(undefined, undefined, {}, { cuentaGit: 1, _id: 1 });
        });
    });

    describe('crear', () => {
        const datos = { nombre: 'Juan', apellido: 'Pérez', cuentaGit: 'juanp', habilidades: [ID_HAB] };

        test('crea el colaborador validando sus habilidades', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(null);
            habilidadService.obtenerPorListaId.mockResolvedValue([{ id: ID_HAB }]);
            colaboradorRepository.save.mockResolvedValue(colaboradorDoc());

            const resultado = await colaboradorService.crear(datos, ID_USUARIO);

            expect(habilidadService.obtenerPorListaId).toHaveBeenCalledWith([ID_HAB]);
            expect(colaboradorRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                usuario: ID_USUARIO,
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

            await colaboradorService.crear({ nombre: 'J', apellido: 'P', cuentaGit: 'jp' }, ID_USUARIO);

            expect(habilidadService.obtenerPorListaId).toHaveBeenCalledWith([]);
        });

        test('lanza ConflictError si la cuenta de Git ya existe', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(colaboradorDoc());

            await expect(colaboradorService.crear(datos, ID_USUARIO)).rejects.toThrow(ConflictError);
            expect(colaboradorRepository.save).not.toHaveBeenCalled();
        });

        test('lanza ConflictError si el usuario ya tiene un perfil de colaborador', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(null);
            colaboradorRepository.findByUsuario.mockResolvedValue(colaboradorDoc());

            await expect(colaboradorService.crear(datos, ID_USUARIO)).rejects.toThrow('El usuario ya tiene un perfil de colaborador asociado');
            expect(colaboradorRepository.findByUsuario).toHaveBeenCalledWith(ID_USUARIO);
            expect(colaboradorRepository.save).not.toHaveBeenCalled();
        });

        test('traduce el error de índice único de usuario a ConflictError', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(null);
            habilidadService.obtenerPorListaId.mockResolvedValue([]);
            colaboradorRepository.save.mockRejectedValue(Object.assign(new Error('E11000'), { code: 11000, keyPattern: { usuario: 1 } }));

            await expect(colaboradorService.crear(datos, ID_USUARIO)).rejects.toThrow(ConflictError);
        });

        test('propaga el error si alguna habilidad no existe', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(null);
            habilidadService.obtenerPorListaId.mockRejectedValue(new NotFoundError('Habilidades no encontradas'));

            await expect(colaboradorService.crear(datos, ID_USUARIO)).rejects.toThrow(NotFoundError);
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

    describe('obtenerContactosAutorizados', () => {
        const contactos = [{ _id: 'x', medio: 'Email', valor: 'a@b.com' }];
        const ID_PROYECTO = '507f1f77bcf86cd799439031';

        beforeEach(() => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(colaboradorDoc({ usuario: ID_USUARIO, contactos }));
        });

        test('la propia colaboradora ve sus contactos', async () => {
            await expect(colaboradorService.obtenerContactosAutorizados('juanp', { id: ID_USUARIO, rol: 'colaborador' }))
                .resolves.toEqual([{ medio: 'Email', valor: 'a@b.com' }]);
        });

        test('otra colaboradora recibe ForbiddenError', async () => {
            await expect(colaboradorService.obtenerContactosAutorizados('juanp', { id: 'otro', rol: 'colaborador' }))
                .rejects.toThrow(ForbiddenError);
        });

        test('un colectivo con postulación aceptada ve los contactos', async () => {
            colectivoRepository.findByUsuario.mockResolvedValue({ proyectos: [ID_PROYECTO] });
            postulacionRepository.existeAceptadaEnProyectos.mockResolvedValue(true);

            await expect(colaboradorService.obtenerContactosAutorizados('juanp', { id: 'col', rol: 'colectivo' }))
                .resolves.toEqual([{ medio: 'Email', valor: 'a@b.com' }]);
            expect(postulacionRepository.existeAceptadaEnProyectos).toHaveBeenCalledWith(ID_COLAB, [ID_PROYECTO]);
        });

        test('un colectivo sin postulación aceptada recibe ForbiddenError', async () => {
            colectivoRepository.findByUsuario.mockResolvedValue({ proyectos: [ID_PROYECTO] });
            postulacionRepository.existeAceptadaEnProyectos.mockResolvedValue(false);

            await expect(colaboradorService.obtenerContactosAutorizados('juanp', { id: 'col', rol: 'colectivo' }))
                .rejects.toThrow(ForbiddenError);
        });

        test('lanza NotFoundError si la colaboradora no existe', async () => {
            colaboradorRepository.findByCuentaGit.mockResolvedValue(null);

            await expect(colaboradorService.obtenerContactosAutorizados('nadie', { id: ID_USUARIO, rol: 'colaborador' }))
                .rejects.toThrow(NotFoundError);
        });
    });
});
