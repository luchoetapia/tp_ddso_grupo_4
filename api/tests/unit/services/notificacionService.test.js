jest.mock('../../../src/repositories/notificacionRepository.js', () => ({
    findByDestinatario: jest.fn(),
    save: jest.fn(),
}));
jest.mock('../../../src/services/proyectoService.js', () => ({
    obtenerPorId: jest.fn(),
    perfilPerteneceAProyecto: jest.fn(),
}));
jest.mock('../../../src/services/colaboradorService.js', () => ({
    obtenerPorCuentaGit: jest.fn(),
    obtenerContactos: jest.fn(),
}));
jest.mock('../../../src/models/Contacto/Notificadores.js', () => ({
    obtenerNotificador: jest.fn(),
}));

const notificacionRepository = require('../../../src/repositories/notificacionRepository.js');
const proyectoService = require('../../../src/services/proyectoService.js');
const colaboradorService = require('../../../src/services/colaboradorService.js');
const { obtenerNotificador } = require('../../../src/models/Contacto/Notificadores.js');
const notificacionService = require('../../../src/services/notificacionService.js');
const { ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_PROY = '507f1f77bcf86cd799439041';
const ID_PERFIL = '507f1f77bcf86cd799439031';
const ID_COLAB = '507f1f77bcf86cd799439011';
const ID_NOTIF = '507f1f77bcf86cd799439081';

const objectId = (id) => ({ toString: () => id });

describe('NotificacionService', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('toDTO', () => {
        test('resume proyecto y perfil si están populados', () => {
            const fecha = new Date();

            const dto = notificacionService.toDTO({
                id: ID_NOTIF,
                destinatario: objectId(ID_COLAB),
                proyecto: { _id: objectId(ID_PROY), titulo: 'Aula', descripcion: 'no se expone' },
                perfil: { _id: objectId(ID_PERFIL), descripcion: 'Backend' },
                mensaje: 'Hola',
                fecha,
            });

            expect(dto).toEqual({
                id: ID_NOTIF,
                destinatario: ID_COLAB,
                proyecto: { id: ID_PROY, titulo: 'Aula' },
                perfil: { id: ID_PERFIL, descripcion: 'Backend' },
                mensaje: 'Hola',
                fecha,
            });
        });

        test('deja los ids tal cual si no están populados', () => {
            const dto = notificacionService.toDTO({
                _id: ID_NOTIF,
                destinatario: { _id: objectId(ID_COLAB) },
                proyecto: ID_PROY,
                perfil: ID_PERFIL,
            });

            expect(dto.id).toBe(ID_NOTIF);
            expect(dto.destinatario).toBe(ID_COLAB);
            expect(dto.proyecto).toBe(ID_PROY);
            expect(dto.perfil).toBe(ID_PERFIL);
        });
    });

    describe('obtenerColaborador', () => {
        test('delega en colaboradorService', async () => {
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue({ id: ID_COLAB });

            await expect(notificacionService.obtenerColaborador('juanp')).resolves.toEqual({ id: ID_COLAB });
            expect(colaboradorService.obtenerPorCuentaGit).toHaveBeenCalledWith('juanp');
        });
    });

    describe('contactarColaborador', () => {
        const prepararEscenario = ({ finalizado = false, deseaSerContactado = true } = {}) => {
            proyectoService.obtenerPorId.mockResolvedValue({ id: ID_PROY, finalizado });
            proyectoService.perfilPerteneceAProyecto.mockResolvedValue({ id: ID_PERFIL });
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue({ id: ID_COLAB, deseaSerContactado });
        };

        test('guarda la notificación y la replica por los medios de contacto', async () => {
            prepararEscenario();
            const guardada = { id: ID_NOTIF, destinatario: ID_COLAB, proyecto: ID_PROY, perfil: ID_PERFIL, mensaje: 'Hola' };
            const contactos = [{ medio: 'Email', valor: 'a@b.com' }];
            const notificador = { enviar: jest.fn() };
            notificacionRepository.save.mockResolvedValue(guardada);
            colaboradorService.obtenerContactos.mockResolvedValue(contactos);
            obtenerNotificador.mockReturnValue(notificador);

            const resultado = await notificacionService.contactarColaborador(ID_PROY, ID_PERFIL, 'juanp', 'Hola');

            expect(notificacionRepository.save).toHaveBeenCalledWith({
                destinatario: ID_COLAB, proyecto: ID_PROY, perfil: ID_PERFIL, mensaje: 'Hola',
            });
            expect(notificador.enviar).toHaveBeenCalledWith(contactos[0], guardada);
            expect(resultado).toMatchObject({ id: ID_NOTIF, mensaje: 'Hola' });
        });

        test('lanza ConflictError si el proyecto está finalizado', async () => {
            prepararEscenario({ finalizado: true });

            await expect(notificacionService.contactarColaborador(ID_PROY, ID_PERFIL, 'juanp', 'Hola'))
                .rejects.toThrow(ConflictError);
            expect(notificacionRepository.save).not.toHaveBeenCalled();
        });

        test('lanza ConflictError si el colaborador no acepta ser contactado', async () => {
            prepararEscenario({ deseaSerContactado: false });

            await expect(notificacionService.contactarColaborador(ID_PROY, ID_PERFIL, 'juanp', 'Hola'))
                .rejects.toThrow('El colaborador no acepta ser contactado');
            expect(notificacionRepository.save).not.toHaveBeenCalled();
        });

        test('propaga NotFoundError si el perfil no pertenece al proyecto', async () => {
            prepararEscenario();
            proyectoService.perfilPerteneceAProyecto.mockRejectedValue(new NotFoundError('El perfil no pertenece al proyecto'));

            await expect(notificacionService.contactarColaborador(ID_PROY, ID_PERFIL, 'juanp', 'Hola'))
                .rejects.toThrow(NotFoundError);
            expect(notificacionRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('replicarPorMediosDeContacto', () => {
        test('envía por cada medio que tenga notificador e ignora los desconocidos', () => {
            const notificador = { enviar: jest.fn() };
            obtenerNotificador.mockImplementation(medio => (medio === 'Email' ? notificador : undefined));
            const contactos = [{ medio: 'Email', valor: 'a@b.com' }, { medio: 'Fax', valor: '123' }];

            notificacionService.replicarPorMediosDeContacto(contactos, 'notificacion');

            expect(notificador.enviar).toHaveBeenCalledTimes(1);
            expect(notificador.enviar).toHaveBeenCalledWith(contactos[0], 'notificacion');
        });

        test('no hace nada sin contactos', () => {
            notificacionService.replicarPorMediosDeContacto(undefined, 'notificacion');

            expect(obtenerNotificador).not.toHaveBeenCalled();
        });
    });

    describe('obtenerPorColaborador', () => {
        test('devuelve las notificaciones del colaborador', async () => {
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue({ id: ID_COLAB });
            notificacionRepository.findByDestinatario.mockResolvedValue([{ id: ID_NOTIF, mensaje: 'Hola' }]);

            const resultado = await notificacionService.obtenerPorColaborador('juanp');

            expect(notificacionRepository.findByDestinatario).toHaveBeenCalledWith(ID_COLAB);
            expect(resultado).toHaveLength(1);
            expect(resultado[0].mensaje).toBe('Hola');
        });

        test('propaga NotFoundError si el colaborador no existe', async () => {
            colaboradorService.obtenerPorCuentaGit.mockRejectedValue(new NotFoundError('Colaborador no encontrado'));

            await expect(notificacionService.obtenerPorColaborador('nadie')).rejects.toThrow(NotFoundError);
        });
    });
});
