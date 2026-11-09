process.env.JWT_ACCESS_KEY = 'clave-access-test';
process.env.JWT_REFRESH_KEY = 'clave-refresh-test';
process.env.JWT_ACCESS_TIME = '10m';
process.env.JWT_REFRESH_TIME = '2d';

jest.mock('../../src/auth/authRepository.js');

const request = require('supertest');
const app = require('../../src/app.js');
const AuthRepository = require('../../src/auth/authRepository.js');
const JwtUtils = require('../../src/token/jwtUtils.js');

const jwt = new JwtUtils();

// El AuthService instancia el repositorio una sola vez al cargar el router: se captura antes de que clearAllMocks limpie mock.instances
const instanciaRepo = AuthRepository.mock.instances[0];
const repositorio = () => instanciaRepo;
const usuario = { id: '507f1f77bcf86cd799439011', username: 'ana', email: 'ana@mail.com', rol: 'colectivo', activo: true };

// Valor de la cookie (sin atributos) a partir de los Set-Cookie de la respuesta
const cookieDe = (res, nombre) => {
    const linea = res.headers['set-cookie']?.find(c => c.startsWith(`${nombre}=`));
    return linea?.split(';')[0].slice(nombre.length + 1);
};
const seBorra = (res, nombre) => {
    const linea = res.headers['set-cookie']?.find(c => c.startsWith(`${nombre}=`));
    return !!linea && linea.startsWith(`${nombre}=;`) && /Expires=Thu, 01 Jan 1970/.test(linea);
};

describe('Endpoints /auth (sesión por cookies)', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => jest.restoreAllMocks());
    beforeEach(() => {
        jest.clearAllMocks();
    });


    describe('POST /auth/refresh', () => {
        test('con refresh token válido renueva ambas cookies y devuelve el usuario', async () => {
            repositorio().obtenerUsuarioPorId.mockResolvedValue(usuario);
            const refresh = jwt.generarRefreshToken(usuario);

            const res = await request(app).post('/auth/refresh').set('Cookie', `refreshToken=${refresh}`);

            expect(res.status).toBe(200);
            expect(res.body.usuario).toEqual({ id: usuario.id, username: 'ana', email: 'ana@mail.com', rol: 'colectivo' });
            expect(jwt.verificarAccessToken(cookieDe(res, 'accessToken')).id).toBe(usuario.id);
            expect(jwt.verificarRefreshToken(cookieDe(res, 'refreshToken')).id).toBe(usuario.id);
            expect(res.headers['set-cookie'].every(c => c.includes('HttpOnly') && c.includes('SameSite=Strict'))).toBe(true);
        });

        test('las cookies duran lo configurado en JWT_ACCESS_TIME y JWT_REFRESH_TIME', async () => {
            repositorio().obtenerUsuarioPorId.mockResolvedValue(usuario);
            const refresh = jwt.generarRefreshToken(usuario);

            const res = await request(app).post('/auth/refresh').set('Cookie', `refreshToken=${refresh}`);
            const maxAge = (nombre) => Number(res.headers['set-cookie'].find(c => c.startsWith(`${nombre}=`)).match(/Max-Age=(\d+)/)[1]);

            expect(maxAge('accessToken')).toBe(10 * 60);
            expect(maxAge('refreshToken')).toBe(2 * 24 * 60 * 60);
        });

        test('usa el rol actual de la base y no el del token viejo', async () => {
            repositorio().obtenerUsuarioPorId.mockResolvedValue({ ...usuario, rol: 'admin' });
            const refresh = jwt.generarRefreshToken(usuario);

            const res = await request(app).post('/auth/refresh').set('Cookie', `refreshToken=${refresh}`);

            expect(jwt.verificarAccessToken(cookieDe(res, 'accessToken')).rol).toBe('admin');
        });

        test('401 y borra cookies si no hay refresh token', async () => {
            const res = await request(app).post('/auth/refresh');

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Falta el refresh token');
            expect(seBorra(res, 'accessToken')).toBe(true);
            expect(seBorra(res, 'refreshToken')).toBe(true);
        });

        test('401 y borra cookies si el refresh token es inválido', async () => {
            const res = await request(app).post('/auth/refresh').set('Cookie', 'refreshToken=basura');

            expect(res.status).toBe(401);
            expect(seBorra(res, 'refreshToken')).toBe(true);
        });

        test('401 si se manda un access token como refresh token', async () => {
            const res = await request(app).post('/auth/refresh').set('Cookie', `refreshToken=${jwt.generarAccessToken(usuario)}`);

            expect(res.status).toBe(401);
        });

        test('401 si el usuario ya no existe', async () => {
            repositorio().obtenerUsuarioPorId.mockResolvedValue(null);

            const res = await request(app).post('/auth/refresh').set('Cookie', `refreshToken=${jwt.generarRefreshToken(usuario)}`);

            expect(res.status).toBe(401);
            expect(seBorra(res, 'accessToken')).toBe(true);
        });

        test('403 y borra cookies si el usuario fue desactivado', async () => {
            repositorio().obtenerUsuarioPorId.mockResolvedValue({ ...usuario, activo: false });

            const res = await request(app).post('/auth/refresh').set('Cookie', `refreshToken=${jwt.generarRefreshToken(usuario)}`);

            expect(res.status).toBe(403);
            expect(seBorra(res, 'refreshToken')).toBe(true);
        });
    });

    describe('POST /auth/logout', () => {
        test('borra ambas cookies con las mismas opciones con las que se crearon', async () => {
            const res = await request(app).post('/auth/logout');

            expect(res.status).toBe(200);
            expect(seBorra(res, 'accessToken')).toBe(true);
            expect(seBorra(res, 'refreshToken')).toBe(true);
            expect(res.headers['set-cookie'].every(c => c.includes('HttpOnly') && c.includes('SameSite=Strict'))).toBe(true);
        });

        test('funciona aunque no haya sesión', async () => {
            const res = await request(app).post('/auth/logout').set('Cookie', 'accessToken=vencido');

            expect(res.status).toBe(200);
        });
    });

    describe('GET /auth/me', () => {
        test('devuelve el usuario de la sesión con la cookie accessToken', async () => {
            repositorio().obtenerUsuarioPorId.mockResolvedValue(usuario);

            const res = await request(app).get('/auth/me').set('Cookie', `accessToken=${jwt.generarAccessToken(usuario)}`);

            expect(res.status).toBe(200);
            expect(res.body.usuario).toEqual({ id: usuario.id, username: 'ana', email: 'ana@mail.com', rol: 'colectivo' });
            expect(res.body.usuario.password).toBeUndefined();
            expect(repositorio().obtenerUsuarioPorId).toHaveBeenCalledWith(usuario.id);
        });

        test('401 sin cookie', async () => {
            const res = await request(app).get('/auth/me');

            expect(res.status).toBe(401);
        });

        test('401 con access token inválido', async () => {
            const res = await request(app).get('/auth/me').set('Cookie', 'accessToken=basura');

            expect(res.status).toBe(401);
        });

        test('401 si se usa un refresh token como access token', async () => {
            const res = await request(app).get('/auth/me').set('Cookie', `accessToken=${jwt.generarRefreshToken(usuario)}`);

            expect(res.status).toBe(401);
        });

        test('403 si el usuario fue desactivado después de emitir el token', async () => {
            repositorio().obtenerUsuarioPorId.mockResolvedValue({ ...usuario, activo: false });

            const res = await request(app).get('/auth/me').set('Cookie', `accessToken=${jwt.generarAccessToken(usuario)}`);

            expect(res.status).toBe(403);
        });
    });
});
