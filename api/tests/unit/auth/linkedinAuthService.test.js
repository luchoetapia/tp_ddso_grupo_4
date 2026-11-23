jest.mock('../../../src/auth/authRepository.js');

const AuthService = require('../../../src/auth/authService.js');
const { descifrar } = require('../../../src/linkedin/cifrado.js');
const { ConflictError, ForbiddenError } = require('../../../src/errors/AppError.js');

const token = { accessToken: 'tok', expiraEn: new Date('2030-01-01'), scopes: ['openid', 'w_member_social'] };
const datos = { sub: 'sub1', email: 'ana@mail.com', emailVerificado: true, nombre: 'Ana', apellido: 'Paz', foto: null };
const colaborador = (linkedin) => ({ id: 'u1', rol: 'colaborador', activo: true, linkedin });

describe('AuthService con LinkedIn', () => {
    const claveOriginal = process.env.LINKEDIN_TOKEN_KEY;
    let service;
    let repo;

    beforeEach(() => {
        process.env.LINKEDIN_TOKEN_KEY = 'clave-test';
        service = new AuthService();
        repo = service.repositorio;
        repo.guardarTokenLinkedin.mockImplementation(async (id) => ({ id, guardado: true }));
        repo.vincularLinkedin.mockImplementation(async (id, linkedin) => colaborador(linkedin));
    });
    afterAll(() => { process.env.LINKEDIN_TOKEN_KEY = claveOriginal; });

    const tokenGuardado = () => repo.guardarTokenLinkedin.mock.calls[0][1];

    describe('vincularLinkedin', () => {
        test('vincula al colaborador logueado y guarda el token cifrado', async () => {
            repo.obtenerUsuarioPorId.mockResolvedValue(colaborador(undefined));
            repo.obtenerUsuarioPorLinkedinSub.mockResolvedValue(null);

            const usuario = await service.vincularLinkedin('u1', datos, token);

            expect(repo.vincularLinkedin).toHaveBeenCalledWith('u1', { sub: 'sub1', nombre: 'Ana', apellido: 'Paz', foto: null });
            expect(descifrar(tokenGuardado().tokenCifrado)).toBe('tok');
            expect(tokenGuardado()).toMatchObject({ tokenExpiraEn: token.expiraEn, scopes: token.scopes });
            expect(usuario).toEqual({ id: 'u1', guardado: true });
        });

        test('si ya estaba vinculado a la misma cuenta solo renueva el token', async () => {
            repo.obtenerUsuarioPorId.mockResolvedValue(colaborador({ sub: 'sub1' }));
            repo.obtenerUsuarioPorLinkedinSub.mockResolvedValue(colaborador({ sub: 'sub1' }));

            await service.vincularLinkedin('u1', datos, token);

            expect(repo.vincularLinkedin).not.toHaveBeenCalled();
            expect(repo.guardarTokenLinkedin).toHaveBeenCalled();
        });

        test('la cuenta de LinkedIn es de otro usuario: 409', async () => {
            repo.obtenerUsuarioPorId.mockResolvedValue(colaborador(undefined));
            repo.obtenerUsuarioPorLinkedinSub.mockResolvedValue({ id: 'otro' });

            await expect(service.vincularLinkedin('u1', datos, token)).rejects.toBeInstanceOf(ConflictError);
            expect(repo.guardarTokenLinkedin).not.toHaveBeenCalled();
        });

        test('el usuario ya tiene otra cuenta de LinkedIn: 409', async () => {
            repo.obtenerUsuarioPorId.mockResolvedValue(colaborador({ sub: 'otro-sub' }));
            repo.obtenerUsuarioPorLinkedinSub.mockResolvedValue(null);

            await expect(service.vincularLinkedin('u1', datos, token)).rejects.toBeInstanceOf(ConflictError);
        });

        test('solo colaboradores', async () => {
            repo.obtenerUsuarioPorId.mockResolvedValue({ id: 'u1', rol: 'colectivo', activo: true });

            await expect(service.vincularLinkedin('u1', datos, token)).rejects.toBeInstanceOf(ForbiddenError);
        });
    });

    describe('ingresarConLinkedin', () => {
        test('guarda el token del usuario que ingresa', async () => {
            repo.obtenerUsuarioPorLinkedinSub.mockResolvedValue(colaborador({ sub: 'sub1' }));

            await service.ingresarConLinkedin(datos, token);

            expect(repo.guardarTokenLinkedin.mock.calls[0][0]).toBe('u1');
            expect(descifrar(tokenGuardado().tokenCifrado)).toBe('tok');
        });

        test('sin LINKEDIN_TOKEN_KEY el ingreso sigue funcionando, sin guardar el token', async () => {
            delete process.env.LINKEDIN_TOKEN_KEY;
            jest.spyOn(console, 'warn').mockImplementation(() => {});
            const vinculado = colaborador({ sub: 'sub1' });
            repo.obtenerUsuarioPorLinkedinSub.mockResolvedValue(vinculado);

            expect(await service.ingresarConLinkedin(datos, token)).toBe(vinculado);
            expect(repo.guardarTokenLinkedin).not.toHaveBeenCalled();
        });
    });
});
