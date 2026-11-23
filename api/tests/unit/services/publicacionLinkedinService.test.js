jest.mock('../../../src/auth/authRepository.js');
jest.mock('../../../src/services/colaboradorService.js', () => ({ buscarPorUsuario: jest.fn() }));
jest.mock('../../../src/repositories/colaboracionRepository.js', () => ({ findActiva: jest.fn() }));
jest.mock('../../../src/services/palabraBaneadaSevice.js', () => ({ detectar: jest.fn() }));

const servicio = require('../../../src/services/publicacionLinkedinService.js');
const colaboradorService = require('../../../src/services/colaboradorService.js');
const colaboracionRepository = require('../../../src/repositories/colaboracionRepository.js');
const palabraBaneadaService = require('../../../src/services/palabraBaneadaSevice.js');
const linkedinService = require('../../../src/linkedin/linkedinService.js');
const { LinkedinNoVinculadoError } = linkedinService;
const { cifrar } = require('../../../src/linkedin/cifrado.js');
const { Usuario } = require('../../../src/auth/models/usuario.js');
const { BadRequestError, ForbiddenError, NotFoundError, BadGatewayError } = require('../../../src/errors/AppError.js');

const ID_USUARIO = 'u1';
const ID_PROYECTO = '507f1f77bcf86cd799439041';
const pedido = { proyectoId: ID_PROYECTO, texto: 'Estoy colaborando' };
const colaboracion = { _id: 'c1', proyecto: { id: ID_PROYECTO } };
const enUnaHora = () => new Date(Date.now() + 3600 * 1000);

const usuarioCon = (linkedin) =>
    new Usuario(ID_USUARIO, 'ana', null, 'ana@mail.com', 'colaborador', true, new Date(), linkedin);

describe('publicacionLinkedinService.publicar', () => {
    const claveOriginal = process.env.LINKEDIN_TOKEN_KEY;
    let repo;

    beforeAll(() => { process.env.LINKEDIN_TOKEN_KEY = 'clave-test'; });
    afterAll(() => { process.env.LINKEDIN_TOKEN_KEY = claveOriginal; });
    beforeEach(() => {
        jest.clearAllMocks();
        repo = servicio.authRepository;
        colaboradorService.buscarPorUsuario.mockResolvedValue({ _id: 'colab1' });
        colaboracionRepository.findActiva.mockResolvedValue(colaboracion);
        palabraBaneadaService.detectar.mockResolvedValue([]);
        repo.obtenerUsuarioConTokenLinkedin.mockResolvedValue(usuarioCon({
            sub: 'sub1', tokenCifrado: cifrar('tok'), tokenExpiraEn: enUnaHora(), scopes: ['w_member_social'],
        }));
        jest.spyOn(linkedinService, 'publicar').mockResolvedValue('urn:li:share:1');
    });

    test('publica con el token descifrado y devuelve el id y la colaboración', async () => {
        const resultado = await servicio.publicar(ID_USUARIO, pedido);

        expect(colaboracionRepository.findActiva).toHaveBeenCalledWith('colab1', ID_PROYECTO);
        expect(linkedinService.publicar).toHaveBeenCalledWith('tok', 'sub1', 'Estoy colaborando');
        expect(resultado).toEqual({ idPublicacion: 'urn:li:share:1', colaboracion });
    });

    test('sin perfil de colaborador responde 404', async () => {
        colaboradorService.buscarPorUsuario.mockResolvedValue(null);

        await expect(servicio.publicar(ID_USUARIO, pedido)).rejects.toBeInstanceOf(NotFoundError);
    });

    test('sin colaboración activa en el proyecto responde 403 y no publica', async () => {
        colaboracionRepository.findActiva.mockResolvedValue(null);

        const error = await servicio.publicar(ID_USUARIO, pedido).catch((e) => e);

        expect(error).toBeInstanceOf(ForbiddenError);
        expect(error).not.toBeInstanceOf(LinkedinNoVinculadoError);
        expect(linkedinService.publicar).not.toHaveBeenCalled();
    });

    test('con palabras baneadas responde 400 con el error en el campo texto', async () => {
        palabraBaneadaService.detectar.mockResolvedValue(['fea']);

        const error = await servicio.publicar(ID_USUARIO, pedido).catch((e) => e);

        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.details[0].path).toEqual(['texto']);
        expect(linkedinService.publicar).not.toHaveBeenCalled();
    });

    test.each([
        ['sin LinkedIn vinculado', null],
        ['vinculado sin token (cuenta anterior al cambio)', { sub: 'sub1' }],
        ['con el token vencido', { sub: 'sub1', tokenCifrado: 'x', tokenExpiraEn: new Date(Date.now() - 1000), scopes: ['w_member_social'] }],
        ['sin el permiso para publicar', { sub: 'sub1', tokenCifrado: 'x', tokenExpiraEn: enUnaHora(), scopes: ['openid'] }],
    ])('%s pide conectar LinkedIn', async (_, linkedin) => {
        repo.obtenerUsuarioConTokenLinkedin.mockResolvedValue(usuarioCon(linkedin));

        await expect(servicio.publicar(ID_USUARIO, pedido)).rejects.toBeInstanceOf(LinkedinNoVinculadoError);
        expect(linkedinService.publicar).not.toHaveBeenCalled();
    });

    test('si LinkedIn rechaza el token se borra para que reconecte', async () => {
        linkedinService.publicar.mockRejectedValue(new LinkedinNoVinculadoError());

        await expect(servicio.publicar(ID_USUARIO, pedido)).rejects.toBeInstanceOf(LinkedinNoVinculadoError);
        expect(repo.borrarTokenLinkedin).toHaveBeenCalledWith(ID_USUARIO);
    });

    test('otros errores de LinkedIn no borran el token', async () => {
        linkedinService.publicar.mockRejectedValue(new BadGatewayError('caído'));

        await expect(servicio.publicar(ID_USUARIO, pedido)).rejects.toBeInstanceOf(BadGatewayError);
        expect(repo.borrarTokenLinkedin).not.toHaveBeenCalled();
    });
});
