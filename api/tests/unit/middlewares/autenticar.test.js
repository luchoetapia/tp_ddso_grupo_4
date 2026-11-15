process.env.JWT_ACCESS_KEY = 'clave-access-test';
process.env.JWT_REFRESH_KEY = 'clave-refresh-test';

const autenticar = require('../../../src/middlewares/autenticar.js');
const JwtUtils = require('../../../src/token/jwtUtils.js');
const { UnauthorizedError, ForbiddenError } = require('../../../src/errors/AppError.js');

const usuario = { id: '507f1f77bcf86cd799439011', username: 'ana', rol: 'colectivo' };
const accessToken = new JwtUtils().generarAccessToken(usuario);

describe('Middleware autenticar', () => {
    test('acepta el token de la cookie accessToken y carga req.usuario', () => {
        const req = { cookies: { accessToken } };
        const next = jest.fn();

        autenticar()(req, {}, next);

        expect(req.usuario).toMatchObject(usuario);
        expect(next).toHaveBeenCalledWith();
    });

    test('acepta el header Authorization Bearer como alternativa', () => {
        const req = { headers: { authorization: `Bearer ${accessToken}` } };
        const next = jest.fn();

        autenticar()(req, {}, next);

        expect(req.usuario).toMatchObject(usuario);
        expect(next).toHaveBeenCalled();
    });

    test('prioriza la cookie sobre el header', () => {
        const otro = new JwtUtils().generarAccessToken({ ...usuario, username: 'otra' });
        const req = { cookies: { accessToken }, headers: { authorization: `Bearer ${otro}` } };

        autenticar()(req, {}, jest.fn());

        expect(req.usuario.username).toBe('ana');
    });

    test('lanza UnauthorizedError si no hay token', () => {
        const next = jest.fn();

        expect(() => autenticar()({}, {}, next)).toThrow(UnauthorizedError);
        expect(() => autenticar()({ cookies: {}, headers: {} }, {}, next)).toThrow('Falta el token de acceso');
        expect(next).not.toHaveBeenCalled();
    });

    test('ignora un header que no es Bearer', () => {
        const req = { headers: { authorization: `Basic ${accessToken}` } };

        expect(() => autenticar()(req, {}, jest.fn())).toThrow('Falta el token de acceso');
    });

    test('lanza UnauthorizedError si el token es inválido', () => {
        const req = { cookies: { accessToken: 'basura' } };

        expect(() => autenticar()(req, {}, jest.fn())).toThrow('Token inválido');
    });

    test('rechaza un refresh token usado como access token', () => {
        const refreshToken = new JwtUtils().generarRefreshToken(usuario);
        const req = { cookies: { accessToken: refreshToken } };

        expect(() => autenticar()(req, {}, jest.fn())).toThrow(UnauthorizedError);
    });

    test('valida el rol permitido (string o lista)', () => {
        const req = () => ({ cookies: { accessToken } });

        expect(() => autenticar('colectivo')(req(), {}, jest.fn())).not.toThrow();
        expect(() => autenticar(['admin', 'colectivo'])(req(), {}, jest.fn())).not.toThrow();
        expect(() => autenticar('admin')(req(), {}, jest.fn())).toThrow(ForbiddenError);
    });
});
