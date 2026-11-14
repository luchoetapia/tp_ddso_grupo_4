jest.mock('../../../src/repositories/proyectoRepository.js', () => ({
    findAll: jest.fn(),
    findByTitulo: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    findByCondition: jest.fn(),
    obtenerActivos: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    updateMultiple: jest.fn(),
    obtenerPerfiles: jest.fn(),
    obtenerPerfil: jest.fn(),
    agregarPerfil: jest.fn(),
    modificarPerfil: jest.fn(),
    eliminarPerfil: jest.fn(),
}));
jest.mock('../../../src/services/habilidadService.js', () => ({
    obtenerPorListaId: jest.fn(),
}));
jest.mock('../../../src/services/colaboradorService.js', () => ({
    obtenerColaboradoresPotenciales: jest.fn(),
}));

const proyectoRepository = require('../../../src/repositories/proyectoRepository.js');
const habilidadService = require('../../../src/services/habilidadService.js');
const colaboradorService = require('../../../src/services/colaboradorService.js');
const proyectoService = require('../../../src/services/proyectoService.js');
const { Proyecto, Perfil } = require('../../../src/models/proyecto.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_PROY = '507f1f77bcf86cd799439041';
const ID_PROY_2 = '507f1f77bcf86cd799439042';
const ID_PERFIL = '507f1f77bcf86cd799439031';
const ID_HAB = '507f1f77bcf86cd799439021';
const ID_HAB_2 = '507f1f77bcf86cd799439022';

// Las habilidades de un perfil embebido llegan como ObjectId, que exponen _id
const hab = (id) => ({ _id: id });
const perfil = (requeridas = [], opcionales = []) =>
    new Perfil(ID_PERFIL, 'Perfil', 'desc', requeridas.map(hab), opcionales.map(hab), { cantHoras: 1, periodo: 'total' }, {});
const proyecto = (id, perfiles = []) => new Proyecto(id, 'Proyecto', 'desc', perfiles);

const proyectoDoc = (extra = {}) => ({
    id: ID_PROY,
    _id: { toString: () => extra.id ?? ID_PROY },
    titulo: 'Aula Virtual',
    descripcion: 'desc',
    perfiles: [],
    finalizado: false,
    ...extra,
});

const perfilDatos = {
    titulo: 'Frontend',
    descripcion: 'desc perfil',
    habilidadesRequeridas: [ID_HAB],
    habilidadesOpcionales: [ID_HAB_2, ID_HAB],
    tipoCompromiso: { cantHoras: 10, periodo: 'semanal' },
    modalidadColaboracion: {},
};

describe('ProyectoService', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('obtenerTodos', () => {
        test('devuelve todos los proyectos', async () => {
            proyectoRepository.findAll.mockResolvedValue([proyectoDoc()]);

            await expect(proyectoService.obtenerTodos()).resolves.toHaveLength(1);
        });
    });

    describe('crear', () => {
        const datos = { titulo: 'Aula Virtual', descripcion: 'desc', perfiles: [perfilDatos] };

        test('crea el proyecto embebiendo sus perfiles y validando sus habilidades', async () => {
            proyectoRepository.findByTitulo.mockResolvedValue(null);
            habilidadService.obtenerPorListaId.mockResolvedValue([]);
            proyectoRepository.save.mockResolvedValue(proyectoDoc());

            const resultado = await proyectoService.crear(datos);

            expect(habilidadService.obtenerPorListaId).toHaveBeenCalledWith([ID_HAB, ID_HAB_2]);
            expect(proyectoRepository.save).toHaveBeenCalledWith({
                titulo: 'Aula Virtual',
                descripcion: 'desc',
                perfiles: [perfilDatos],
                enlaceSistema: null,
                enlaceCodigoFuente: null,
            });
            expect(resultado.id).toBe(ID_PROY);
        });

        test('usa lista de perfiles vacía si no se envía', async () => {
            proyectoRepository.findByTitulo.mockResolvedValue(null);
            proyectoRepository.save.mockResolvedValue(proyectoDoc());

            await proyectoService.crear({ titulo: 'x', descripcion: 'y' });

            expect(habilidadService.obtenerPorListaId).not.toHaveBeenCalled();
            expect(proyectoRepository.save).toHaveBeenCalledWith(expect.objectContaining({ perfiles: [] }));
        });

        test('lanza ConflictError si ya existe un proyecto con ese título', async () => {
            proyectoRepository.findByTitulo.mockResolvedValue(proyectoDoc());

            await expect(proyectoService.crear(datos)).rejects.toThrow(ConflictError);
            expect(proyectoRepository.save).not.toHaveBeenCalled();
        });

        test('no guarda si alguna habilidad de los perfiles no existe', async () => {
            proyectoRepository.findByTitulo.mockResolvedValue(null);
            habilidadService.obtenerPorListaId.mockRejectedValue(new NotFoundError('Habilidades no encontradas'));

            await expect(proyectoService.crear(datos)).rejects.toThrow(NotFoundError);
            expect(proyectoRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('obtenerPorId', () => {
        test('devuelve el proyecto encontrado', async () => {
            proyectoRepository.findById.mockResolvedValue(proyectoDoc());

            await expect(proyectoService.obtenerPorId(ID_PROY)).resolves.toMatchObject({ id: ID_PROY });
        });

        test('pasa la proyección al repositorio', async () => {
            proyectoRepository.findById.mockResolvedValue(proyectoDoc());

            await proyectoService.obtenerPorId(ID_PROY, { finalizado: 1 });

            expect(proyectoRepository.findById).toHaveBeenCalledWith(ID_PROY, { finalizado: 1 });
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
            proyectoRepository.update.mockResolvedValue(proyectoDoc({ finalizado: true }));

            const resultado = await proyectoService.finalizar(ID_PROY);

            expect(proyectoRepository.update).toHaveBeenCalledWith(ID_PROY, { finalizado: true });
            expect(resultado.finalizado).toBe(true);
        });

        test('lanza NotFoundError si el proyecto no existe', async () => {
            proyectoRepository.update.mockResolvedValue(null);

            await expect(proyectoService.finalizar(ID_PROY)).rejects.toThrow(NotFoundError);
        });

        test('lanza BadRequestError con id inválido', async () => {
            await expect(proyectoService.finalizar('malo')).rejects.toThrow(BadRequestError);
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
        test('devuelve los proyectos activos del repositorio', async () => {
            proyectoRepository.obtenerActivos.mockResolvedValue([proyectoDoc({ id: 'activo' })]);

            const resultado = await proyectoService.proyectosActivos();

            expect(resultado.map(p => p.id)).toEqual(['activo']);
        });
    });

    describe('puedeAplicar', () => {
        test('es verdadero si cumple las habilidades de algún perfil', async () => {
            proyectoRepository.findById.mockResolvedValue(proyecto(ID_PROY, [perfil([ID_HAB])]));

            await expect(proyectoService.puedeAplicar(ID_PROY, [ID_HAB])).resolves.toBe(true);
            expect(proyectoRepository.findById).toHaveBeenCalledWith(ID_PROY, { finalizado: 1, perfiles: 1 });
        });

        test('es falso si no cumple ningún perfil', async () => {
            proyectoRepository.findById.mockResolvedValue(proyecto(ID_PROY, [perfil([ID_HAB])]));

            await expect(proyectoService.puedeAplicar(ID_PROY, [ID_HAB_2])).resolves.toBe(false);
        });

        test('es falso si el proyecto está finalizado', async () => {
            const finalizado = proyecto(ID_PROY, [perfil([ID_HAB])]);
            finalizado.finalizado = true;
            proyectoRepository.findById.mockResolvedValue(finalizado);

            await expect(proyectoService.puedeAplicar(ID_PROY, [ID_HAB])).resolves.toBe(false);
        });
    });

    describe('buscarPotencialesProyectos', () => {
        test('busca proyectos activos con algún perfil cumplible', async () => {
            proyectoRepository.findByCondition.mockResolvedValue([]);

            await proyectoService.buscarPotencialesProyectos([ID_HAB]);

            expect(proyectoRepository.findByCondition).toHaveBeenCalledWith({
                finalizado: false,
                perfiles: { 
                    $elemMatch: { 
                        busquedaAbierta: true,
                        $or: [{ fechaFinBusqueda: null }, { fechaFinBusqueda: { $gt: expect.any(Date) } }],
                        habilidadesRequeridas: { $not: { $elemMatch: { $nin: [ID_HAB] } } } 
                    } 
                },
            });
        });

        test('ordena por perfiles cumplidos y desempata por habilidades cumplidas', async () => {
            const unPerfil = proyecto('unPerfil', [perfil([ID_HAB])]);
            const unPerfilConOpcional = proyecto('unPerfilConOpcional', [perfil([ID_HAB], [ID_HAB_2])]);
            const dosPerfiles = proyecto('dosPerfiles', [perfil([ID_HAB]), perfil([])]);
            proyectoRepository.findByCondition.mockResolvedValue([unPerfil, unPerfilConOpcional, dosPerfiles]);

            const resultado = await proyectoService.buscarPotencialesProyectos([ID_HAB, ID_HAB_2]);

            expect(resultado.map(p => p.id)).toEqual(['dosPerfiles', 'unPerfilConOpcional', 'unPerfil']);
        });
    });

    describe('perfilPerteneceAProyecto', () => {
        test('devuelve el perfil si pertenece al proyecto', async () => {
            const p = perfil();
            proyectoRepository.obtenerPerfil.mockResolvedValue(p);

            await expect(proyectoService.perfilPerteneceAProyecto(ID_PROY, ID_PERFIL)).resolves.toBe(p);
            expect(proyectoRepository.obtenerPerfil).toHaveBeenCalledWith(ID_PROY, ID_PERFIL);
        });

        test('lanza NotFoundError si el perfil no pertenece', async () => {
            proyectoRepository.obtenerPerfil.mockResolvedValue(null);

            await expect(proyectoService.perfilPerteneceAProyecto(ID_PROY, ID_PERFIL)).rejects.toThrow(NotFoundError);
        });
    });

    describe('buscarPotencialesColaboradores', () => {
        test('busca colaboradores para el perfil indicado', async () => {
            const p = perfil([ID_HAB]);
            proyectoRepository.obtenerPerfil.mockResolvedValue(p);
            colaboradorService.obtenerColaboradoresPotenciales.mockResolvedValue([{ cuentaGit: 'juanp' }]);

            const resultado = await proyectoService.buscarPotencialesColaboradores(ID_PROY, ID_PERFIL);

            expect(colaboradorService.obtenerColaboradoresPotenciales).toHaveBeenCalledWith([p]);
            expect(resultado).toEqual([{ cuentaGit: 'juanp' }]);
        });

        test('lanza NotFoundError si el perfil no pertenece al proyecto', async () => {
            proyectoRepository.obtenerPerfil.mockResolvedValue(null);

            await expect(proyectoService.buscarPotencialesColaboradores(ID_PROY, ID_PERFIL)).rejects.toThrow(NotFoundError);
            expect(colaboradorService.obtenerColaboradoresPotenciales).not.toHaveBeenCalled();
        });
    });

    describe('obtenerPerfiles', () => {
        test('devuelve los perfiles del proyecto', async () => {
            proyectoRepository.obtenerPerfiles.mockResolvedValue([perfil()]);

            await expect(proyectoService.obtenerPerfiles(ID_PROY)).resolves.toHaveLength(1);
        });

        test('lanza NotFoundError si el proyecto no existe', async () => {
            proyectoRepository.obtenerPerfiles.mockResolvedValue(null);

            await expect(proyectoService.obtenerPerfiles(ID_PROY)).rejects.toThrow(NotFoundError);
        });
    });

    describe('agregarPerfil', () => {
        test('valida las habilidades y devuelve el perfil agregado', async () => {
            const agregado = perfil();
            proyectoRepository.agregarPerfil.mockResolvedValue({ perfiles: [perfil(), agregado] });

            const resultado = await proyectoService.agregarPerfil(ID_PROY, perfilDatos);

            expect(habilidadService.obtenerPorListaId).toHaveBeenCalledWith([ID_HAB, ID_HAB_2]);
            expect(proyectoRepository.agregarPerfil).toHaveBeenCalledWith(ID_PROY, perfilDatos);
            expect(resultado).toBe(agregado);
        });

        test('no agrega si alguna habilidad no existe', async () => {
            habilidadService.obtenerPorListaId.mockRejectedValue(new NotFoundError('Habilidades no encontradas'));

            await expect(proyectoService.agregarPerfil(ID_PROY, perfilDatos)).rejects.toThrow(NotFoundError);
            expect(proyectoRepository.agregarPerfil).not.toHaveBeenCalled();
        });

        test('lanza NotFoundError si el proyecto no existe', async () => {
            proyectoRepository.agregarPerfil.mockResolvedValue(null);

            await expect(proyectoService.agregarPerfil(ID_PROY, perfilDatos)).rejects.toThrow(NotFoundError);
        });
    });

    describe('modificarPerfil', () => {
        test('devuelve el perfil modificado', async () => {
            const modificado = perfil();
            proyectoRepository.modificarPerfil.mockResolvedValue({ perfiles: { id: () => modificado } });

            const resultado = await proyectoService.modificarPerfil(ID_PROY, ID_PERFIL, { titulo: 'Nuevo' });

            expect(habilidadService.obtenerPorListaId).not.toHaveBeenCalled();
            expect(proyectoRepository.modificarPerfil).toHaveBeenCalledWith(ID_PROY, ID_PERFIL, { titulo: 'Nuevo' });
            expect(resultado).toBe(modificado);
        });

        test('valida las habilidades si se modifican', async () => {
            proyectoRepository.modificarPerfil.mockResolvedValue({ perfiles: { id: () => perfil() } });

            await proyectoService.modificarPerfil(ID_PROY, ID_PERFIL, { habilidadesRequeridas: [ID_HAB] });

            expect(habilidadService.obtenerPorListaId).toHaveBeenCalledWith([ID_HAB]);
        });

        test('lanza NotFoundError si el proyecto o el perfil no existen', async () => {
            proyectoRepository.modificarPerfil.mockResolvedValue(null);

            await expect(proyectoService.modificarPerfil(ID_PROY, ID_PERFIL, { titulo: 'x' })).rejects.toThrow(NotFoundError);
        });
    });

    describe('eliminarPerfil', () => {
        test('elimina el perfil del proyecto', async () => {
            proyectoRepository.eliminarPerfil.mockResolvedValue(proyectoDoc());

            await proyectoService.eliminarPerfil(ID_PROY, ID_PERFIL);

            expect(proyectoRepository.eliminarPerfil).toHaveBeenCalledWith(ID_PROY, ID_PERFIL);
        });

        test('lanza NotFoundError si el proyecto o el perfil no existen', async () => {
            proyectoRepository.eliminarPerfil.mockResolvedValue(null);

            await expect(proyectoService.eliminarPerfil(ID_PROY, ID_PERFIL)).rejects.toThrow(NotFoundError);
        });
    });
});
