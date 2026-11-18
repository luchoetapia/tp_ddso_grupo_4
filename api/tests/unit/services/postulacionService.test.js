jest.mock('../../../src/repositories/postulacionRepository.js', () => ({
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findActiva: jest.fn(),
    updateEstado: jest.fn(),
}));

jest.mock('../../../src/repositories/colaboracionRepository.js', () => ({
    save: jest.fn(),
    contarActivasPorPerfil: jest.fn(),
}));

jest.mock('../../../src/repositories/colectivoRepository.js', () => ({
    findById: jest.fn(),
    findByUsuario: jest.fn(),
}));

jest.mock('../../../src/services/proyectoService.js', () => ({
    obtenerPorId: jest.fn(),
    modificarPerfil: jest.fn(),
    obtenerEditablePorColectivo: jest.fn(),
}));

jest.mock('../../../src/services/colaboradorService.js', () => ({
    obtenerPorId: jest.fn(),
    obtenerPorCuentaGit: jest.fn(),
    buscarPorUsuario: jest.fn(),
}));

const postulacionRepository = require('../../../src/repositories/postulacionRepository.js');
const colaboracionRepository = require('../../../src/repositories/colaboracionRepository.js');
const colectivoRepository = require('../../../src/repositories/colectivoRepository.js');
const proyectoService = require('../../../src/services/proyectoService.js');
const colaboradorService = require('../../../src/services/colaboradorService.js');
const postulacionService = require('../../../src/services/postulacionService.js');
const EstadoPostulacion = require('../../../src/models/Proyecto/Postulaciones/EstadoPostulacion.js');
const { ConflictError, NotFoundError, BadRequestError, ForbiddenError } = require('../../../src/errors/AppError.js');
const { roles } = require('../../../src/auth/models/usuario.js');

const ID_PROY = '507f1f77bcf86cd799439041';
const ID_PERFIL = '507f1f77bcf86cd799439051';
const ID_COLAB = '507f1f77bcf86cd799439011';
const ID_POSTULACION = '507f1f77bcf86cd799439071';
const ID_COLECTIVO = '507f1f77bcf86cd799439081';

describe('PostulacionService', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('crear', () => {
        const datos = {
            idProyecto: ID_PROY,
            idPerfil: ID_PERFIL,
            idColaborador: ID_COLAB,
            mensaje: 'Me interesa el proyecto'
        };

        const prepararEscenario = ({
            finalizado = false,
            busquedaAbierta = true,
            fechaFinBusqueda = null,
            cumpleHabilidades = true,
            postulacionActiva = null
        } = {}) => {
            const perfilMock = {
                _id: ID_PERFIL,
                busquedaAbierta,
                fechaFinBusqueda,
                cumpleHabilidadesRequeridas: jest.fn().mockReturnValue(cumpleHabilidades)
            };

            proyectoService.obtenerPorId.mockResolvedValue({
                id: ID_PROY,
                finalizado,
                perfiles: {
                    id: jest.fn().mockReturnValue(perfilMock)
                }
            });

            colaboradorService.obtenerPorId.mockResolvedValue({
                id: ID_COLAB,
                habilidades: ['hab1']
            });

            postulacionRepository.findActiva.mockResolvedValue(postulacionActiva);
        };

        test('crea la postulación si se cumplen todos los requisitos', async () => {
            prepararEscenario();
            postulacionRepository.save.mockImplementation(async (data) => ({
                id: ID_POSTULACION,
                ...data
            }));

            const resultado = await postulacionService.crear(datos);

            expect(resultado).toMatchObject({
                id: ID_POSTULACION,
                colaborador: ID_COLAB,
                proyecto: ID_PROY,
                perfil: ID_PERFIL,
                estado: EstadoPostulacion.PENDIENTE
            });
            expect(postulacionRepository.save).toHaveBeenCalled();
        });

        test('lanza ConflictError si el proyecto está finalizado', async () => {
            prepararEscenario({ finalizado: true });

            await expect(postulacionService.crear(datos)).rejects.toThrow(ConflictError);
            expect(postulacionRepository.save).not.toHaveBeenCalled();
        });

        test('lanza NotFoundError si el perfil no pertenece al proyecto', async () => {
            proyectoService.obtenerPorId.mockResolvedValue({
                id: ID_PROY,
                finalizado: false,
                perfiles: {
                    id: jest.fn().mockReturnValue(null)
                }
            });

            await expect(postulacionService.crear(datos)).rejects.toThrow(NotFoundError);
            expect(postulacionRepository.save).not.toHaveBeenCalled();
        });

        test('lanza ConflictError si la búsqueda del perfil está cerrada', async () => {
            prepararEscenario({ busquedaAbierta: false });

            await expect(postulacionService.crear(datos)).rejects.toThrow(ConflictError);
            expect(postulacionRepository.save).not.toHaveBeenCalled();
        });

        test('lanza ConflictError si la fecha fin de búsqueda expiró', async () => {
            const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
            prepararEscenario({ fechaFinBusqueda: ayer });

            await expect(postulacionService.crear(datos)).rejects.toThrow(ConflictError);
            expect(postulacionRepository.save).not.toHaveBeenCalled();
        });

        test('lanza ConflictError si el colaborador no cumple las habilidades requeridas', async () => {
            prepararEscenario({ cumpleHabilidades: false });

            await expect(postulacionService.crear(datos)).rejects.toThrow(ConflictError);
            expect(postulacionRepository.save).not.toHaveBeenCalled();
        });

        test('lanza ConflictError si ya tiene una postulación pendiente o aceptada', async () => {
            prepararEscenario({ postulacionActiva: { id: 'otra' } });

            await expect(postulacionService.crear(datos)).rejects.toThrow(ConflictError);
            expect(postulacionRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('obtenerTodas', () => {
        test('devuelve postulaciones aplicando filtros directos', async () => {
            postulacionRepository.findAll.mockResolvedValue([{ id: ID_POSTULACION }]);

            const resultado = await postulacionService.obtenerTodas({
                idProyecto: ID_PROY,
                estado: EstadoPostulacion.PENDIENTE
            });

            expect(resultado).toHaveLength(1);
            expect(postulacionRepository.findAll).toHaveBeenCalledWith({
                proyecto: ID_PROY,
                estado: EstadoPostulacion.PENDIENTE
            });
        });

        test('filtra por colectivo obteniendo los proyectos del colectivo', async () => {
            colectivoRepository.findById.mockResolvedValue({
                id: ID_COLECTIVO,
                proyectos: [{ _id: ID_PROY }]
            });
            postulacionRepository.findAll.mockResolvedValue([{ id: ID_POSTULACION }]);

            const resultado = await postulacionService.obtenerTodas({ idColectivo: ID_COLECTIVO });

            expect(resultado).toHaveLength(1);
            expect(postulacionRepository.findAll).toHaveBeenCalledWith({
                proyecto: { $in: [ID_PROY] }
            });
        });
    });

    describe('actualizarEstado', () => {
        const postulacionMock = {
            id: ID_POSTULACION,
            estado: EstadoPostulacion.PENDIENTE,
            proyecto: { id: ID_PROY },
            perfil: ID_PERFIL,
            colaborador: { id: ID_COLAB }
        };

        test('lanza BadRequestError si el id no es un ObjectId válido', async () => {
            await expect(postulacionService.actualizarEstado('invalido', EstadoPostulacion.ACEPTADA))
                .rejects.toThrow(BadRequestError);
        });

        test('lanza ConflictError si la postulación ya no está en estado Pendiente', async () => {
            postulacionRepository.findById.mockResolvedValue({
                ...postulacionMock,
                estado: EstadoPostulacion.ACEPTADA
            });

            await expect(postulacionService.actualizarEstado(ID_POSTULACION, EstadoPostulacion.RECHAZADA))
                .rejects.toThrow(ConflictError);
        });

        test('actualiza a Rechazada sin crear colaboración', async () => {
            postulacionRepository.findById.mockResolvedValue(postulacionMock);
            postulacionRepository.updateEstado.mockResolvedValue({
                ...postulacionMock,
                estado: EstadoPostulacion.RECHAZADA
            });

            const res = await postulacionService.actualizarEstado(ID_POSTULACION, EstadoPostulacion.RECHAZADA);

            expect(res.estado).toBe(EstadoPostulacion.RECHAZADA);
            expect(colaboracionRepository.save).not.toHaveBeenCalled();
        });

        test('al aceptar crea colaboración activa y actualiza estado a Aceptada', async () => {
            postulacionRepository.findById.mockResolvedValue(postulacionMock);
            proyectoService.obtenerPorId.mockResolvedValue({
                id: ID_PROY,
                perfiles: {
                    id: jest.fn().mockReturnValue({
                        _id: ID_PERFIL,
                        limiteColaboraciones: 5
                    })
                }
            });
            colaboracionRepository.contarActivasPorPerfil.mockResolvedValue(2);
            postulacionRepository.updateEstado.mockResolvedValue({
                ...postulacionMock,
                estado: EstadoPostulacion.ACEPTADA
            });

            const res = await postulacionService.actualizarEstado(ID_POSTULACION, EstadoPostulacion.ACEPTADA);

            expect(colaboracionRepository.save).toHaveBeenCalledWith({
                colaborador: ID_COLAB,
                proyecto: ID_PROY,
                perfil: ID_PERFIL,
                inicio: expect.any(Date)
            });
            expect(res.estado).toBe(EstadoPostulacion.ACEPTADA);
        });

        test('al aceptar cierra la búsqueda si se alcanza el límite de colaboraciones', async () => {
            postulacionRepository.findById.mockResolvedValue(postulacionMock);
            proyectoService.obtenerPorId.mockResolvedValue({
                id: ID_PROY,
                perfiles: {
                    id: jest.fn().mockReturnValue({
                        _id: ID_PERFIL,
                        limiteColaboraciones: 3
                    })
                }
            });
            colaboracionRepository.contarActivasPorPerfil.mockResolvedValue(2);
            postulacionRepository.updateEstado.mockResolvedValue({
                ...postulacionMock,
                estado: EstadoPostulacion.ACEPTADA
            });

            await postulacionService.actualizarEstado(ID_POSTULACION, EstadoPostulacion.ACEPTADA);

            expect(proyectoService.modificarPerfil).toHaveBeenCalledWith(
                ID_PROY,
                ID_PERFIL,
                { busquedaAbierta: false }
            );
        });

        test('lanza ConflictError si se intenta aceptar pero ya se alcanzó el límite', async () => {
            postulacionRepository.findById.mockResolvedValue(postulacionMock);
            proyectoService.obtenerPorId.mockResolvedValue({
                id: ID_PROY,
                perfiles: {
                    id: jest.fn().mockReturnValue({
                        _id: ID_PERFIL,
                        limiteColaboraciones: 2
                    })
                }
            });
            colaboracionRepository.contarActivasPorPerfil.mockResolvedValue(2);

            await expect(postulacionService.actualizarEstado(ID_POSTULACION, EstadoPostulacion.ACEPTADA))
                .rejects.toThrow(ConflictError);

            expect(colaboracionRepository.save).not.toHaveBeenCalled();
            expect(postulacionRepository.updateEstado).not.toHaveBeenCalled();
        });
    });

    describe('Aceptación y rechazo automático de postulaciones', () => {
        const datos = {
            idProyecto: ID_PROY,
            idPerfil: ID_PERFIL,
            idColaborador: ID_COLAB,
            mensaje: 'Me interesa colaborar'
        };

        const prepararEscenarioEstrategia = ({
            estrategia = 'RevisionManual',
            limiteColaboraciones = null,
            busquedaAbierta = true,
            postulacionesPrevias = []
        } = {}) => {
            const perfilMock = {
                _id: ID_PERFIL,
                id: ID_PERFIL,
                busquedaAbierta,
                limiteColaboraciones,
                cumpleHabilidadesRequeridas: jest.fn().mockReturnValue(true)
            };

            proyectoService.obtenerPorId.mockResolvedValue({
                id: ID_PROY,
                _id: ID_PROY,
                finalizado: false,
                estrategiaAceptacion: estrategia,
                perfiles: {
                    id: jest.fn().mockReturnValue(perfilMock)
                }
            });

            colaboradorService.obtenerPorId.mockResolvedValue({
                id: ID_COLAB,
                habilidades: ['hab1']
            });

            postulacionRepository.findActiva.mockResolvedValue(null);
            postulacionRepository.findAll.mockResolvedValue(postulacionesPrevias);
            colaboracionRepository.contarActivasPorPerfil.mockResolvedValue(0);

            postulacionRepository.save.mockImplementation(async (data) => ({
                id: ID_POSTULACION,
                _id: ID_POSTULACION,
                ...data
            }));

            postulacionRepository.updateEstado.mockImplementation(async (id, nuevoEstado) => ({
                id,
                _id: id,
                colaborador: ID_COLAB,
                proyecto: ID_PROY,
                perfil: ID_PERFIL,
                estado: nuevoEstado
            }));
        };

        test('con TodoSuma se acepta automáticamente y se genera la colaboración', async () => {
            prepararEscenarioEstrategia({ estrategia: 'TodoSuma' });

            const resultado = await postulacionService.crear(datos);

            expect(resultado.estado).toBe(EstadoPostulacion.ACEPTADA);
            expect(colaboracionRepository.save).toHaveBeenCalledWith({
                colaborador: ID_COLAB,
                proyecto: ID_PROY,
                perfil: ID_PERFIL,
                inicio: expect.any(Date)
            });
            expect(postulacionRepository.updateEstado).toHaveBeenCalledWith(
                ID_POSTULACION,
                EstadoPostulacion.ACEPTADA
            );
        });

        test('con RevisionManual la postulación queda en Pendiente y no crea colaboración', async () => {
            prepararEscenarioEstrategia({ estrategia: 'RevisionManual' });

            const resultado = await postulacionService.crear(datos);

            expect(resultado.estado).toBe(EstadoPostulacion.PENDIENTE);
            expect(colaboracionRepository.save).not.toHaveBeenCalled();
            expect(postulacionRepository.updateEstado).not.toHaveBeenCalled();
        });

        test('con HastaLlenarVacantes, mientras no alcance el cupo queda Pendiente', async () => {
            prepararEscenarioEstrategia({
                estrategia: 'HastaLlenarVacantes',
                limiteColaboraciones: 2,
                postulacionesPrevias: []
            });

            const resultado = await postulacionService.crear(datos);

            expect(resultado.estado).toBe(EstadoPostulacion.PENDIENTE);
            expect(colaboracionRepository.save).not.toHaveBeenCalled();
            expect(proyectoService.modificarPerfil).not.toHaveBeenCalled();
        });

        test('con HastaLlenarVacantes, al completar el límite acepta todas, crea colaboraciones y cierra búsqueda', async () => {
            const ID_POST_PREVIA = '507f1f77bcf86cd799439099';
            const postPrevia = {
                id: ID_POST_PREVIA,
                _id: ID_POST_PREVIA,
                colaborador: '507f1f77bcf86cd799439012',
                proyecto: ID_PROY,
                perfil: ID_PERFIL,
                estado: EstadoPostulacion.PENDIENTE
            };

            prepararEscenarioEstrategia({
                estrategia: 'HastaLlenarVacantes',
                limiteColaboraciones: 2,
                postulacionesPrevias: [postPrevia]
            });

            const resultado = await postulacionService.crear(datos);

            expect(resultado.estado).toBe(EstadoPostulacion.ACEPTADA);
            // Crea colaboración para la postulación previa y para la actual
            expect(colaboracionRepository.save).toHaveBeenCalledTimes(2);
            // Ambas son actualizadas a ACEPTADA en el repositorio
            expect(postulacionRepository.updateEstado).toHaveBeenCalledWith(ID_POST_PREVIA, EstadoPostulacion.ACEPTADA);
            expect(postulacionRepository.updateEstado).toHaveBeenCalledWith(ID_POSTULACION, EstadoPostulacion.ACEPTADA);
            // Se cierra la búsqueda en el perfil
            expect(proyectoService.modificarPerfil).toHaveBeenCalledWith(
                ID_PROY,
                ID_PERFIL,
                { busquedaAbierta: false }
            );
        });

        test('con HastaLlenarVacantes, postulación que excede el cupo es rechazada automáticamente', async () => {
            const postPrevia1 = {
                id: '507f1f77bcf86cd799439091',
                _id: '507f1f77bcf86cd799439091',
                colaborador: 'c1',
                proyecto: ID_PROY,
                perfil: ID_PERFIL,
                estado: EstadoPostulacion.ACEPTADA
            };
            const postPrevia2 = {
                id: '507f1f77bcf86cd799439092',
                _id: '507f1f77bcf86cd799439092',
                colaborador: 'c2',
                proyecto: ID_PROY,
                perfil: ID_PERFIL,
                estado: EstadoPostulacion.ACEPTADA
            };

            prepararEscenarioEstrategia({
                estrategia: 'HastaLlenarVacantes',
                limiteColaboraciones: 2,
                postulacionesPrevias: [postPrevia1, postPrevia2]
            });

            const resultado = await postulacionService.crear(datos);

            expect(resultado.estado).toBe(EstadoPostulacion.RECHAZADA);
            expect(postulacionRepository.updateEstado).toHaveBeenCalledWith(
                ID_POSTULACION,
                EstadoPostulacion.RECHAZADA
            );
        });
    });
describe('control de acceso por sesión', () => {
        const ID_USUARIO = '507f1f77bcf86cd7994390aa';
        const ID_OTRO = '507f1f77bcf86cd799439099';
        const comoColaboradora = { id: ID_USUARIO, rol: roles.COLABORADOR };
        const comoColectivo = { id: ID_USUARIO, rol: roles.COLECTIVO };
        const colaboradoraPropia = { id: ID_COLAB, cuentaGit: 'juanp', habilidades: ['hab1'] };
        const colectivoPropio = { id: ID_COLECTIVO, proyectos: [{ _id: ID_PROY }] };

        describe('crear', () => {
            const prepararProyecto = () => {
                proyectoService.obtenerPorId.mockResolvedValue({
                    id: ID_PROY,
                    finalizado: false,
                    perfiles: { id: jest.fn().mockReturnValue({ _id: ID_PERFIL, busquedaAbierta: true, cumpleHabilidadesRequeridas: () => true }) },
                });
                colaboradorService.buscarPorUsuario.mockResolvedValue(colaboradoraPropia);
                postulacionRepository.findActiva.mockResolvedValue(null);
                postulacionRepository.save.mockImplementation(async (data) => ({ id: ID_POSTULACION, ...data }));
            };

            test('postula a la colaboradora de la sesión', async () => {
                prepararProyecto();

                const resultado = await postulacionService.crear({ idProyecto: ID_PROY, idPerfil: ID_PERFIL }, comoColaboradora);

                expect(colaboradorService.buscarPorUsuario).toHaveBeenCalledWith(ID_USUARIO);
                expect(resultado.colaborador).toBe(ID_COLAB);
            });

            test('lanza ForbiddenError si intenta postular a otra persona', async () => {
                prepararProyecto();

                await expect(postulacionService.crear({ idProyecto: ID_PROY, idPerfil: ID_PERFIL, cuentaGit: 'otra' }, comoColaboradora))
                    .rejects.toThrow(ForbiddenError);
                await expect(postulacionService.crear({ idProyecto: ID_PROY, idPerfil: ID_PERFIL, idColaborador: ID_OTRO }, comoColaboradora))
                    .rejects.toThrow(ForbiddenError);
                expect(postulacionRepository.save).not.toHaveBeenCalled();
            });
        });

        describe('obtenerTodas', () => {
            test('la colaboradora solo ve sus postulaciones', async () => {
                colaboradorService.buscarPorUsuario.mockResolvedValue(colaboradoraPropia);
                postulacionRepository.findAll.mockResolvedValue([]);

                await postulacionService.obtenerTodas({ idProyecto: ID_PROY }, comoColaboradora);

                expect(postulacionRepository.findAll).toHaveBeenCalledWith({ proyecto: ID_PROY, colaborador: ID_COLAB });
            });

            test('lanza ForbiddenError si la colaboradora pide las de otra', async () => {
                colaboradorService.buscarPorUsuario.mockResolvedValue(colaboradoraPropia);

                await expect(postulacionService.obtenerTodas({ idColaborador: ID_OTRO }, comoColaboradora)).rejects.toThrow(ForbiddenError);
                expect(postulacionRepository.findAll).not.toHaveBeenCalled();
            });

            test('el colectivo ve las de un proyecto propio (respeta el filtro)', async () => {
                colectivoRepository.findByUsuario.mockResolvedValue(colectivoPropio);
                colectivoRepository.findById.mockResolvedValue(colectivoPropio);
                postulacionRepository.findAll.mockResolvedValue([]);

                await postulacionService.obtenerTodas({ idProyecto: ID_PROY }, comoColectivo);

                expect(postulacionRepository.findAll).toHaveBeenCalledWith({ proyecto: ID_PROY });
            });

            test('sin filtro, el colectivo ve solo las de sus proyectos', async () => {
                colectivoRepository.findByUsuario.mockResolvedValue(colectivoPropio);
                colectivoRepository.findById.mockResolvedValue(colectivoPropio);
                postulacionRepository.findAll.mockResolvedValue([]);

                await postulacionService.obtenerTodas({}, comoColectivo);

                expect(postulacionRepository.findAll).toHaveBeenCalledWith({ proyecto: { $in: [ID_PROY] } });
            });

            test('lanza ForbiddenError si el colectivo pide las de un proyecto ajeno', async () => {
                colectivoRepository.findByUsuario.mockResolvedValue(colectivoPropio);

                await expect(postulacionService.obtenerTodas({ idProyecto: ID_OTRO }, comoColectivo)).rejects.toThrow(ForbiddenError);
                expect(postulacionRepository.findAll).not.toHaveBeenCalled();
            });
        });

        describe('obtenerPorId', () => {
            const postulacion = { id: ID_POSTULACION, colaborador: { _id: ID_COLAB }, proyecto: { _id: ID_PROY } };

            test('la ve la colaboradora que se postuló', async () => {
                postulacionRepository.findById.mockResolvedValue(postulacion);
                colaboradorService.buscarPorUsuario.mockResolvedValue(colaboradoraPropia);

                await expect(postulacionService.obtenerPorId(ID_POSTULACION, comoColaboradora)).resolves.toBe(postulacion);
            });

            test('la ve el colectivo dueño del proyecto', async () => {
                postulacionRepository.findById.mockResolvedValue(postulacion);
                colectivoRepository.findByUsuario.mockResolvedValue(colectivoPropio);

                await expect(postulacionService.obtenerPorId(ID_POSTULACION, comoColectivo)).resolves.toBe(postulacion);
            });

            test('lanza ForbiddenError para otra colaboradora u otro colectivo', async () => {
                postulacionRepository.findById.mockResolvedValue(postulacion);
                colaboradorService.buscarPorUsuario.mockResolvedValue({ id: ID_OTRO });
                colectivoRepository.findByUsuario.mockResolvedValue({ id: 'otro', proyectos: [] });

                await expect(postulacionService.obtenerPorId(ID_POSTULACION, comoColaboradora)).rejects.toThrow(ForbiddenError);
                await expect(postulacionService.obtenerPorId(ID_POSTULACION, comoColectivo)).rejects.toThrow(ForbiddenError);
            });
        });

        describe('actualizarEstado', () => {
            test('lanza ForbiddenError si el proyecto no es del colectivo, sin cambiar el estado', async () => {
                postulacionRepository.findById.mockResolvedValue({
                    id: ID_POSTULACION, estado: EstadoPostulacion.PENDIENTE, proyecto: { _id: ID_PROY },
                });
                proyectoService.obtenerEditablePorColectivo.mockRejectedValue(new ForbiddenError('El proyecto no pertenece a tu colectivo'));

                await expect(postulacionService.actualizarEstado(ID_POSTULACION, EstadoPostulacion.RECHAZADA, comoColectivo))
                    .rejects.toThrow(ForbiddenError);
                expect(proyectoService.obtenerEditablePorColectivo).toHaveBeenCalledWith(ID_PROY, ID_USUARIO);
                expect(postulacionRepository.updateEstado).not.toHaveBeenCalled();
            });
        });
    });
});
