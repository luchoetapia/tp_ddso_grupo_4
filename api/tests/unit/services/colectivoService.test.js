jest.mock('../../../src/services/reporteService.js', () => ({
    revisarEnSegundoPlano: jest.fn()
}));

jest.mock('../../../src/repositories/colectivoRepository.js', () => ({
    buscarConPaginacion: jest.fn(),
    findAll: jest.fn(),
    findByNombre: jest.fn(),
    findByUsuario: jest.fn(),
    findById: jest.fn(),
    findBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    obtenerProyectosConPerfiles: jest.fn(),
}));
jest.mock('../../../src/services/colaboradorService.js', () => ({
    obtenerColaboradoresPotenciales: jest.fn(),
}));
jest.mock('../../../src/services/proyectoService.js', () => ({
    obtenerPorListaId: jest.fn(),
    finalizar: jest.fn(),
    finalizarVariosProyectos: jest.fn(),
}));

const colectivoRepository = require('../../../src/repositories/colectivoRepository.js');
const proyectoService = require('../../../src/services/proyectoService.js');
const colaboradorService = require('../../../src/services/colaboradorService.js');
const colectivoService = require('../../../src/services/colectivoService.js');
const reporteService = require('../../../src/services/reporteService.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_COLECTIVO = '507f1f77bcf86cd799439051';
const ID_PROY = '507f1f77bcf86cd799439041';
const ID_USUARIO = '507f1f77bcf86cd7994390aa';

const colectivoDoc = (extra = {}) => ({
    id: ID_COLECTIVO,
    nombre: 'Tech For Good',
    active: true,
    descripcion: 'desc',
    ubicacion: 'Córdoba',
    tipo: 'fundacion',
    proyectos: [],
    ...extra,
});

describe('ColectivoService', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('obtenerTodos', () => {
        test('pagina en la BD ordenando por nombre', async () => {
            const pagina = { colectivos: [colectivoDoc()], total: 1, pagina: 1, limite: 10, totalPaginas: 1 };
            colectivoRepository.buscarConPaginacion.mockResolvedValue(pagina);

            await expect(colectivoService.obtenerTodos({ pagina: 1, limite: 10 })).resolves.toBe(pagina);
            expect(colectivoRepository.buscarConPaginacion).toHaveBeenCalledWith(1, 10, {}, { nombre: 1, _id: 1 });
        });
    });

    describe('obtenerActivos', () => {
        test('filtra los colectivos activos y pagina en la BD', async () => {
            const pagina = { colectivos: [colectivoDoc()], total: 1, pagina: 2, limite: 5, totalPaginas: 1 };
            colectivoRepository.buscarConPaginacion.mockResolvedValue(pagina);

            await expect(colectivoService.obtenerActivos({ pagina: 2, limite: 5 })).resolves.toBe(pagina);
            expect(colectivoRepository.buscarConPaginacion).toHaveBeenCalledWith(2, 5, { active: true }, { nombre: 1, _id: 1 });
        });
    });

    describe('crear', () => {
        const datos = { nombre: 'Tech For Good', tipo: 'fundacion', proyectos: [ID_PROY] };

        test('crea el colectivo validando los proyectos', async () => {
            colectivoRepository.findByNombre.mockResolvedValue(null);
            proyectoService.obtenerPorListaId.mockResolvedValue([{ _id: ID_PROY }]);
            colectivoRepository.save.mockResolvedValue(colectivoDoc());

            const resultado = await colectivoService.crear(datos, ID_USUARIO);

            expect(reporteService.revisarEnSegundoPlano).toHaveBeenCalledWith('Colectivo', resultado);
            expect(proyectoService.obtenerPorListaId).toHaveBeenCalledWith([ID_PROY]);
            expect(colectivoRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                usuario: ID_USUARIO,
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

            await colectivoService.crear({ nombre: 'x', tipo: 'ong' }, ID_USUARIO);

            expect(proyectoService.obtenerPorListaId).toHaveBeenCalledWith([]);
        });

        test('lanza ConflictError si ya existe uno con ese nombre', async () => {
            colectivoRepository.findByNombre.mockResolvedValue(colectivoDoc());

            await expect(colectivoService.crear(datos, ID_USUARIO)).rejects.toThrow(ConflictError);
            expect(colectivoRepository.save).not.toHaveBeenCalled();
        });

        test('lanza ConflictError si el usuario ya tiene un colectivo', async () => {
            colectivoRepository.findByNombre.mockResolvedValue(null);
            colectivoRepository.findByUsuario.mockResolvedValue(colectivoDoc());

            await expect(colectivoService.crear(datos, ID_USUARIO)).rejects.toThrow('El usuario ya tiene un colectivo asociado');
            expect(colectivoRepository.findByUsuario).toHaveBeenCalledWith(ID_USUARIO);
            expect(colectivoRepository.save).not.toHaveBeenCalled();
        });

        test('traduce el error de índice único de usuario a ConflictError', async () => {
            colectivoRepository.findByNombre.mockResolvedValue(null);
            proyectoService.obtenerPorListaId.mockResolvedValue([]);
            colectivoRepository.save.mockRejectedValue(Object.assign(new Error('E11000'), { code: 11000, keyPattern: { usuario: 1 } }));

            await expect(colectivoService.crear(datos, ID_USUARIO)).rejects.toThrow(ConflictError);
        });

        test('propaga otros errores de la base sin transformarlos', async () => {
            colectivoRepository.findByNombre.mockResolvedValue(null);
            proyectoService.obtenerPorListaId.mockResolvedValue([]);
            colectivoRepository.save.mockRejectedValue(new Error('se cayó la base'));

            await expect(colectivoService.crear(datos, ID_USUARIO)).rejects.toThrow('se cayó la base');
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

    describe('desactivarColectivo', () => {
        const ID_PROY_2 = '507f1f77bcf86cd799439042';

        test('finaliza los proyectos y desactiva el colectivo', async () => {
            colectivoRepository.findById.mockResolvedValue(colectivoDoc({ proyectos: [{ id: ID_PROY }, { id: ID_PROY_2 }] }));
            proyectoService.finalizarVariosProyectos.mockResolvedValue(2);
            colectivoRepository.update.mockResolvedValue(colectivoDoc({ active: false }));

            const resultado = await colectivoService.desactivarColectivo(ID_COLECTIVO);

            expect(proyectoService.finalizarVariosProyectos).toHaveBeenCalledWith([ID_PROY, ID_PROY_2]);
            expect(colectivoRepository.update).toHaveBeenCalledWith(ID_COLECTIVO, { active: false });
            expect(resultado).toEqual({ mensaje: 'Colectivo Tech For Good desactivado correctamente, 2 proyectos finalizados.' });
        });

        test('no finaliza proyectos si el colectivo no tiene', async () => {
            colectivoRepository.findById.mockResolvedValue(colectivoDoc());
            colectivoRepository.update.mockResolvedValue(colectivoDoc({ active: false }));

            const resultado = await colectivoService.desactivarColectivo(ID_COLECTIVO);

            expect(proyectoService.finalizarVariosProyectos).not.toHaveBeenCalled();
            expect(resultado.mensaje).toContain('0 proyectos finalizados');
        });

        test('lanza BadRequestError si ya está desactivado', async () => {
            colectivoRepository.findById.mockResolvedValue(colectivoDoc({ active: false }));

            await expect(colectivoService.desactivarColectivo(ID_COLECTIVO)).rejects.toThrow(BadRequestError);
            expect(proyectoService.finalizarVariosProyectos).not.toHaveBeenCalled();
            expect(colectivoRepository.update).not.toHaveBeenCalled();
        });

        test('lanza NotFoundError si no existe', async () => {
            colectivoRepository.findById.mockResolvedValue(null);

            await expect(colectivoService.desactivarColectivo(ID_COLECTIVO)).rejects.toThrow(NotFoundError);
            expect(colectivoRepository.update).not.toHaveBeenCalled();
        });

        test('lanza BadRequestError con id inválido', async () => {
            await expect(colectivoService.desactivarColectivo('malo')).rejects.toThrow(BadRequestError);
        });
    });

    describe('actualizarPorUsuario', () => {
        test('actualiza el colectivo del usuario de la sesión', async () => {
            colectivoRepository.findByUsuario.mockResolvedValue(colectivoDoc());
            colectivoRepository.update.mockResolvedValue(colectivoDoc({ ubicacion: 'CABA' }));

            const resultado = await colectivoService.actualizarPorUsuario(ID_USUARIO, { ubicacion: 'CABA' });

            expect(colectivoRepository.findByUsuario).toHaveBeenCalledWith(ID_USUARIO);
            expect(colectivoRepository.update).toHaveBeenCalledWith(ID_COLECTIVO, { ubicacion: 'CABA' });
            expect(resultado.ubicacion).toBe('CABA');
        });

        test('permite cambiar el nombre si no lo usa otro colectivo', async () => {
            colectivoRepository.findByUsuario.mockResolvedValue(colectivoDoc());
            colectivoRepository.findByNombre.mockResolvedValue(null);
            colectivoRepository.update.mockResolvedValue(colectivoDoc({ nombre: 'Nuevo nombre' }));

            await colectivoService.actualizarPorUsuario(ID_USUARIO, { nombre: 'Nuevo nombre' });

            expect(colectivoRepository.findByNombre).toHaveBeenCalledWith('Nuevo nombre');
            expect(colectivoRepository.update).toHaveBeenCalledWith(ID_COLECTIVO, { nombre: 'Nuevo nombre' });
        });

        test('no busca duplicados si el nombre no cambia', async () => {
            colectivoRepository.findByUsuario.mockResolvedValue(colectivoDoc());
            colectivoRepository.update.mockResolvedValue(colectivoDoc());

            await colectivoService.actualizarPorUsuario(ID_USUARIO, { nombre: 'Tech For Good' });

            expect(colectivoRepository.findByNombre).not.toHaveBeenCalled();
        });

        test('lanza ConflictError si el nombre ya lo usa otro colectivo', async () => {
            colectivoRepository.findByUsuario.mockResolvedValue(colectivoDoc());
            colectivoRepository.findByNombre.mockResolvedValue(colectivoDoc({ id: '507f1f77bcf86cd799439099', nombre: 'Otro' }));

            await expect(colectivoService.actualizarPorUsuario(ID_USUARIO, { nombre: 'Otro' })).rejects.toThrow(ConflictError);
            expect(colectivoRepository.update).not.toHaveBeenCalled();
        });

        test('lanza NotFoundError si el usuario no tiene colectivo', async () => {
            colectivoRepository.findByUsuario.mockResolvedValue(null);

            await expect(colectivoService.actualizarPorUsuario(ID_USUARIO, { ubicacion: 'CABA' })).rejects.toThrow(NotFoundError);
            expect(colectivoRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('obtenerPotencialesColaboradores', () => {
        const ID_PROY_2 = '507f1f77bcf86cd799439042';
        const id = (valor) => ({ toString: () => valor });
        const perfilAbierto = { _id: id('pf1'), titulo: 'Back', habilidadesRequeridas: ['h1'], busquedaAbierta: true };
        const perfilCerrado = { _id: id('pf2'), titulo: 'Front', habilidadesRequeridas: ['h2'], busquedaAbierta: false };
        const perfilOtro = { _id: id('pf3'), titulo: 'QA', habilidadesRequeridas: ['h3'], busquedaAbierta: true };
        const proyecto = (idProyecto, extra = {}) => ({ _id: id(idProyecto), titulo: `Proyecto ${idProyecto}`, finalizado: false, perfiles: [], ...extra });
        const paginacion = { pagina: 2, limite: 5, orden: 'nombre', direccion: 'desc' };
        const pagina = { colaboradores: [{ id: 'c1', habilidades: [{ _id: id('h1') }] }], total: 6, pagina: 2, limite: 5, totalPaginas: 2 };

        test('busca con los perfiles abiertos de los proyectos activos y propaga la paginación', async () => {
            colectivoRepository.obtenerProyectosConPerfiles.mockResolvedValue([
                proyecto(ID_PROY, { perfiles: [perfilAbierto, perfilCerrado] }),
                proyecto(ID_PROY_2, { finalizado: true, perfiles: [perfilOtro] }),
            ]);
            colaboradorService.obtenerColaboradoresPotenciales.mockResolvedValue(pagina);

            const resultado = await colectivoService.obtenerPotencialesColaboradores(ID_COLECTIVO, [], paginacion);

            expect(colectivoRepository.obtenerProyectosConPerfiles).toHaveBeenCalledWith(ID_COLECTIVO);
            expect(colaboradorService.obtenerColaboradoresPotenciales).toHaveBeenCalledWith([perfilAbierto], paginacion);
            expect(resultado).toMatchObject({ total: 6, pagina: 2, limite: 5, totalPaginas: 2 });
            expect(resultado.colaboradores).toHaveLength(1);
            expect(resultado.colaboradores[0].colaborador).toBe(pagina.colaboradores[0]);
        });

        test('indica en qué perfiles encaja cada colaborador', async () => {
            const perfilSinRequisitos = { _id: id('pf4'), titulo: 'Docs', habilidadesRequeridas: [], busquedaAbierta: true };
            const perfilDoble = { _id: id('pf5'), titulo: 'Full', habilidadesRequeridas: ['h1', 'h3'], busquedaAbierta: true };
            colectivoRepository.obtenerProyectosConPerfiles.mockResolvedValue([
                proyecto(ID_PROY, { perfiles: [perfilAbierto, perfilDoble] }),
                proyecto(ID_PROY_2, { perfiles: [perfilOtro, perfilSinRequisitos] }),
            ]);
            colaboradorService.obtenerColaboradoresPotenciales.mockResolvedValue(pagina);

            const { colaboradores } = await colectivoService.obtenerPotencialesColaboradores(ID_COLECTIVO, [], paginacion);

            expect(colaboradores[0].perfilesCompatibles).toEqual([
                { proyecto: { id: ID_PROY, titulo: `Proyecto ${ID_PROY}` }, perfil: { id: 'pf1', titulo: 'Back' } },
                { proyecto: { id: ID_PROY_2, titulo: `Proyecto ${ID_PROY_2}` }, perfil: { id: 'pf4', titulo: 'Docs' } },
            ]);
        });

        test('acota la búsqueda a los proyectos pedidos', async () => {
            colectivoRepository.obtenerProyectosConPerfiles.mockResolvedValue([
                proyecto(ID_PROY, { perfiles: [perfilAbierto] }),
                proyecto(ID_PROY_2, { perfiles: [perfilOtro] }),
            ]);
            colaboradorService.obtenerColaboradoresPotenciales.mockResolvedValue(pagina);

            await colectivoService.obtenerPotencialesColaboradores(ID_COLECTIVO, [ID_PROY_2], paginacion);

            expect(colaboradorService.obtenerColaboradoresPotenciales).toHaveBeenCalledWith([perfilOtro], paginacion);
        });

        test('lanza NotFoundError si un proyecto pedido no es del colectivo', async () => {
            colectivoRepository.obtenerProyectosConPerfiles.mockResolvedValue([proyecto(ID_PROY, { perfiles: [perfilAbierto] })]);

            await expect(colectivoService.obtenerPotencialesColaboradores(ID_COLECTIVO, [ID_PROY_2]))
                .rejects.toThrow(NotFoundError);
            expect(colaboradorService.obtenerColaboradoresPotenciales).not.toHaveBeenCalled();
        });

        test('devuelve una página vacía si no hay perfiles abiertos (no trae a todas)', async () => {
            colectivoRepository.obtenerProyectosConPerfiles.mockResolvedValue([proyecto(ID_PROY, { perfiles: [perfilCerrado] })]);

            const resultado = await colectivoService.obtenerPotencialesColaboradores(ID_COLECTIVO, [], { pagina: 3, limite: 20 });

            expect(resultado).toEqual({ colaboradores: [], total: 0, pagina: 3, limite: 20, totalPaginas: 0 });
            expect(colaboradorService.obtenerColaboradoresPotenciales).not.toHaveBeenCalled();
        });

        test('lanza NotFoundError si el colectivo no existe', async () => {
            colectivoRepository.obtenerProyectosConPerfiles.mockResolvedValue(null);

            await expect(colectivoService.obtenerPotencialesColaboradores(ID_COLECTIVO)).rejects.toThrow(NotFoundError);
        });
    });
});
