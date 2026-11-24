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
    buscarPorUsuario: jest.fn(),
}));
jest.mock('../../../src/repositories/colectivoRepository.js', () => ({
    findByUsuario: jest.fn(),
}));
jest.mock('../../../src/models/Notificacion.js', () => ({
    ...jest.requireActual('../../../src/models/Notificacion.js'),
    obtenerNotificador: jest.fn(),
}));

const notificacionRepository = require('../../../src/repositories/notificacionRepository.js');
const proyectoService = require('../../../src/services/proyectoService.js');
const colaboradorService = require('../../../src/services/colaboradorService.js');
const { obtenerNotificador } = require('../../../src/models/Notificacion.js');
const colectivoRepository = require('../../../src/repositories/colectivoRepository.js');
const notificacionService = require('../../../src/services/notificacionService.js');
const { ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_PROY = '507f1f77bcf86cd799439041';
const ID_PERFIL = '507f1f77bcf86cd799439031';
const ID_COLAB = '507f1f77bcf86cd799439011';
const ID_NOTIF = '507f1f77bcf86cd799439081';

const objectId = (id) => ({ toString: () => id });

const notificacionGuardada = (extra = {}) => ({
    id: ID_NOTIF,
    destinatario: ID_COLAB,
    proyecto: { id: objectId(ID_PROY), titulo: 'Aula' },
    perfil: { id: objectId(ID_PERFIL), descripcion: 'Backend' },
    mensaje: 'Hola',
    ...extra,
});

describe('NotificacionService', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('obtenerColaborador', () => {
        test('delega en colaboradorService', async () => {
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue({ id: ID_COLAB });

            await expect(notificacionService.obtenerColaborador('juanp')).resolves.toEqual({ id: ID_COLAB });
            expect(colaboradorService.obtenerPorCuentaGit).toHaveBeenCalledWith('juanp');
        });
    });

    describe('contactarColaborador', () => {
        const prepararEscenario = ({ finalizado = false, deseaSerContactado = true, usuarioActivo = true } = {}) => {
            proyectoService.obtenerPorId.mockResolvedValue({ id: ID_PROY, titulo: 'Aula', finalizado });
            proyectoService.perfilPerteneceAProyecto.mockResolvedValue({ id: ID_PERFIL, descripcion: 'Backend' });
            colaboradorService.obtenerPorCuentaGit.mockResolvedValue({ id: ID_COLAB, deseaSerContactado,usuario: { activo: usuarioActivo }});
        };

        test('guarda la notificación con la copia de proyecto y perfil y la replica por los medios de contacto', async () => {
            prepararEscenario();
            const guardada = notificacionGuardada();
            const contactos = [{ medio: 'Email', valor: 'a@b.com' }];
            const notificador = { enviar: jest.fn() };
            notificacionRepository.save.mockResolvedValue(guardada);
            colaboradorService.obtenerContactos.mockResolvedValue(contactos);
            obtenerNotificador.mockReturnValue(notificador);

            const resultado = await notificacionService.contactarColaborador(ID_PROY, ID_PERFIL, 'juanp', 'Hola');

            expect(notificacionRepository.save).toHaveBeenCalledWith({
                destinatario: ID_COLAB,
                proyecto: { id: ID_PROY, titulo: 'Aula' },
                perfil: { id: ID_PERFIL, descripcion: 'Backend' },
                mensaje: 'Hola',
            });
            expect(notificador.enviar).toHaveBeenCalledWith(contactos[0], guardada);
            expect(resultado).toBe(guardada);
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

        test('rechaza notificar a una cuenta inactiva', async () => {
            prepararEscenario({ usuarioActivo: false });

            await expect(
                notificacionService.contactarColaborador(ID_PROY, ID_PERFIL, 'juanp', 'Hola')
            ).rejects.toThrow('No se puede contactar a una cuenta inactiva');
            expect(notificacionRepository.save).not.toHaveBeenCalled();
            expect(colaboradorService.obtenerContactos).not.toHaveBeenCalled();
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

    describe('obtenerPropias', () => {
        const ID_USUARIO = '507f1f77bcf86cd7994390aa';
        const ID_TITULAR = '507f1f77bcf86cd7994390bb';

        beforeEach(() => notificacionRepository.findByDestinatario.mockResolvedValue([notificacionGuardada()]));

        // Las notificaciones se guardan con el id del usuario, no del colaborador
        test('a una colaboradora le devuelve las dirigidas a su usuario', async () => {
            const resultado = await notificacionService.obtenerPropias({ id: ID_USUARIO, rol: 'colaborador' });

            expect(notificacionRepository.findByDestinatario).toHaveBeenCalledWith([ID_USUARIO]);
            expect(colectivoRepository.findByUsuario).not.toHaveBeenCalled();
            expect(resultado).toHaveLength(1);
        });

        test('a la titular de un colectivo le devuelve solo las suyas', async () => {
            colectivoRepository.findByUsuario.mockResolvedValue({ usuario: ID_USUARIO });

            await notificacionService.obtenerPropias({ id: ID_USUARIO, rol: 'colectivo' });

            expect(notificacionRepository.findByDestinatario).toHaveBeenCalledWith([ID_USUARIO]);
        });

        test('a un administrador adicional también le devuelve las dirigidas a la titular', async () => {
            colectivoRepository.findByUsuario.mockResolvedValue({ usuario: ID_TITULAR });

            await notificacionService.obtenerPropias({ id: ID_USUARIO, rol: 'colectivo' });

            expect(colectivoRepository.findByUsuario).toHaveBeenCalledWith(ID_USUARIO);
            expect(notificacionRepository.findByDestinatario).toHaveBeenCalledWith([ID_USUARIO, ID_TITULAR]);
        });

        test('una cuenta de colectivo sin colectivo creado ve solo las suyas', async () => {
            colectivoRepository.findByUsuario.mockResolvedValue(null);

            await notificacionService.obtenerPropias({ id: ID_USUARIO, rol: 'colectivo' });

            expect(notificacionRepository.findByDestinatario).toHaveBeenCalledWith([ID_USUARIO]);
        });
    });
});
