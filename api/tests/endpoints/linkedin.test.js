jest.mock('../../src/auth/authRepository.js');
jest.mock('../../src/services/auditoriaService.js', () => ({ registrar: jest.fn() }));
jest.mock('../../src/services/publicacionLinkedinService.js', () => ({ publicar: jest.fn() }));

const request = require('supertest');
const app = require('../../src/app.js');
const AuthService = require('../../src/auth/authService.js');
const linkedinService = require('../../src/linkedin/linkedinService.js');
const { LinkedinNoVinculadoError, CODIGO_NO_VINCULADO } = linkedinService;
const colaboradorService = require('../../src/services/colaboradorService.js');
const publicacionLinkedinService = require('../../src/services/publicacionLinkedinService.js');
const auditoriaService = require('../../src/services/auditoriaService.js');
const { ConflictError, ForbiddenError } = require('../../src/errors/AppError.js');
const { AccionAuditada } = require('../../src/models/Auditoria.js');
const { cookieDeSesion, ID_USUARIO } = require('../helpers/sesion.js');
const { roles } = require('../../src/auth/models/usuario.js');

const FRONT = 'http://front.test';
const ID_PROY = '507f1f77bcf86cd799439041';

// Valor de la cookie (sin atributos) a partir de los Set-Cookie de la respuesta
const cookieDe = (res, nombre) => {
    const linea = res.headers['set-cookie']?.find(c => c.startsWith(`${nombre}=`));
    return linea?.split(';')[0].slice(nombre.length + 1);
};
const redireccion = (res) => new URL(res.headers.location);

describe('LinkedIn: vincular cuenta y publicar', () => {
    const envOriginal = { ...process.env };

    beforeAll(() => {
        Object.assign(process.env, {
            FRONT_URL: FRONT,
            LINKEDIN_CLIENT_ID: 'id',
            LINKEDIN_CLIENT_SECRET: 'secreto',
            LINKEDIN_REDIRECT_URI: 'http://api.test/api/auth/linkedin/callback',
            LINKEDIN_TOKEN_KEY: 'clave-test',
        });
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => {
        process.env = envOriginal;
        jest.restoreAllMocks();
    });
    beforeEach(() => jest.clearAllMocks());

    describe('POST /linkedin/publicaciones', () => {
        const body = { proyectoId: ID_PROY, texto: 'Estoy colaborando en este proyecto' };
        const publicar = (cookie, datos = body) => {
            const req = request(app).post('/linkedin/publicaciones');
            return (cookie ? req.set('Cookie', cookie) : req).send(datos);
        };

        test('publica, devuelve el link al post y lo audita', async () => {
            publicacionLinkedinService.publicar.mockResolvedValue({
                idPublicacion: 'urn:li:share:1',
                colaboracion: { _id: 'c1', proyecto: { id: ID_PROY } },
            });

            const res = await publicar(cookieDeSesion(roles.COLABORADOR));

            expect(res.status).toBe(201);
            expect(res.body.data).toEqual({
                idPublicacion: 'urn:li:share:1',
                url: 'https://www.linkedin.com/feed/update/urn:li:share:1/',
                proyectoId: ID_PROY,
                colaboracionId: 'c1',
            });
            expect(publicacionLinkedinService.publicar).toHaveBeenCalledWith(ID_USUARIO, body);
            expect(auditoriaService.registrar).toHaveBeenCalledWith(expect.objectContaining({
                accion: AccionAuditada.PUBLICACION_LINKEDIN,
                idProyecto: ID_PROY,
            }));
        });

        test('sin sesión responde 401', async () => {
            expect((await publicar()).status).toBe(401);
        });

        test('un colectivo no puede publicar (403)', async () => {
            expect((await publicar(cookieDeSesion(roles.COLECTIVO))).status).toBe(403);
            expect(publicacionLinkedinService.publicar).not.toHaveBeenCalled();
        });

        test.each([
            ['sin texto', { proyectoId: ID_PROY }],
            ['texto vacío', { proyectoId: ID_PROY, texto: '   ' }],
            ['texto de más de 3000 caracteres', { proyectoId: ID_PROY, texto: 'a'.repeat(3001) }],
            ['id de proyecto inválido', { proyectoId: '123', texto: 'hola' }],
        ])('%s responde 400', async (_, datos) => {
            expect((await publicar(cookieDeSesion(roles.COLABORADOR), datos)).status).toBe(400);
        });

        test('sin LinkedIn conectado responde 403 con el código para que el front pida conectarlo', async () => {
            publicacionLinkedinService.publicar.mockRejectedValue(new LinkedinNoVinculadoError());

            const res = await publicar(cookieDeSesion(roles.COLABORADOR));

            expect(res.status).toBe(403);
            expect(res.body.details).toEqual([{ codigo: CODIGO_NO_VINCULADO }]);
            expect(auditoriaService.registrar).not.toHaveBeenCalled();
        });

        test('sin colaboración en el proyecto responde 403 sin el código', async () => {
            publicacionLinkedinService.publicar.mockRejectedValue(new ForbiddenError('No colaborás'));

            const res = await publicar(cookieDeSesion(roles.COLABORADOR));

            expect(res.status).toBe(403);
            expect(res.body.details).toEqual([]);
        });
    });

    describe('GET /auth/linkedin/vincular', () => {
        test('sin sesión responde 401', async () => {
            expect((await request(app).get('/auth/linkedin/vincular')).status).toBe(401);
        });

        test('un colectivo no puede vincular (403)', async () => {
            const res = await request(app).get('/auth/linkedin/vincular').set('Cookie', cookieDeSesion(roles.COLECTIVO));
            expect(res.status).toBe(403);
        });

        test('redirige a LinkedIn pidiendo permiso para publicar y guarda el state', async () => {
            const res = await request(app)
                .get('/auth/linkedin/vincular?volverA=/colaboradoras/misPostulaciones')
                .set('Cookie', cookieDeSesion(roles.COLABORADOR));

            expect(res.status).toBe(302);
            const url = redireccion(res);
            expect(url.origin + url.pathname).toBe('https://www.linkedin.com/oauth/v2/authorization');
            expect(url.searchParams.get('scope')).toContain('w_member_social');
            expect(cookieDe(res, 'linkedinState')).toBeTruthy();
        });
    });

    describe('GET /auth/linkedin/callback', () => {
        const token = { accessToken: 'tok', expiraEn: new Date('2030-01-01'), scopes: ['w_member_social'] };
        const datos = { sub: 'sub1', email: 'ana@mail.com', emailVerificado: true, nombre: 'Ana', apellido: 'Paz', foto: null };

        beforeEach(() => {
            jest.spyOn(linkedinService, 'canjearCodigo').mockResolvedValue(token);
            jest.spyOn(linkedinService, 'obtenerDatos').mockResolvedValue(datos);
        });

        // Arranca el flujo (ingreso o vinculación) y devuelve la cookie y el state que mandaría LinkedIn de vuelta
        const iniciar = async (ruta, cookieSesion) => {
            const req = request(app).get(ruta);
            const res = await (cookieSesion ? req.set('Cookie', cookieSesion) : req);
            return { cookie: `linkedinState=${cookieDe(res, 'linkedinState')}`, state: redireccion(res).searchParams.get('state') };
        };
        const volver = ({ cookie, state }, extra = '') =>
            request(app).get(`/auth/linkedin/callback?code=abc&state=${state}${extra}`).set('Cookie', cookie);

        describe('vinculando', () => {
            const ruta = `/auth/linkedin/vincular?volverA=${encodeURIComponent(`/proyectos/ver?id=${ID_PROY}`)}&publicar=${ID_PROY}`;

            test('vincula al usuario que inició el flujo y vuelve a la pantalla de origen sin tocar la sesión', async () => {
                const vincular = jest.spyOn(AuthService.prototype, 'vincularLinkedin').mockResolvedValue({});
                const flujo = await iniciar(ruta, cookieDeSesion(roles.COLABORADOR));

                const res = await volver(flujo);

                expect(res.status).toBe(302);
                expect(vincular).toHaveBeenCalledWith(ID_USUARIO, datos, token);
                const url = redireccion(res);
                expect(url.origin + url.pathname).toBe(`${FRONT}/proyectos/ver`);
                expect(Object.fromEntries(url.searchParams)).toEqual({ id: ID_PROY, linkedin: 'vinculado', publicar: ID_PROY });
                expect(cookieDe(res, 'accessToken')).toBeUndefined();
            });

            test('un error vuelve a la pantalla de origen con el mensaje', async () => {
                jest.spyOn(AuthService.prototype, 'vincularLinkedin').mockRejectedValue(new ConflictError('Esa cuenta ya está vinculada'));
                const flujo = await iniciar(ruta, cookieDeSesion(roles.COLABORADOR));

                const url = redireccion(await volver(flujo));

                expect(url.pathname).toBe('/proyectos/ver');
                expect(url.searchParams.get('errorLinkedin')).toBe('Esa cuenta ya está vinculada');
            });

            test('si el usuario cancela en LinkedIn vuelve con el aviso', async () => {
                const flujo = await iniciar(ruta, cookieDeSesion(roles.COLABORADOR));

                const res = await request(app).get('/auth/linkedin/callback?error=user_cancelled_authorize').set('Cookie', flujo.cookie);

                expect(redireccion(res).searchParams.get('errorLinkedin')).toBe('Se canceló la conexión con LinkedIn');
                expect(linkedinService.canjearCodigo).not.toHaveBeenCalled();
            });

            test('si LinkedIn rechaza el permiso no dice que se canceló', async () => {
                const flujo = await iniciar(ruta, cookieDeSesion(roles.COLABORADOR));

                const res = await request(app)
                    .get('/auth/linkedin/callback?error=unauthorized_scope_error&error_description=Scope+not+authorized')
                    .set('Cookie', flujo.cookie);

                expect(redireccion(res).searchParams.get('errorLinkedin')).toBe('LinkedIn rechazó la solicitud (unauthorized_scope_error)');
            });

            test('un volverA externo se ignora y vuelve a datos personales', async () => {
                jest.spyOn(AuthService.prototype, 'vincularLinkedin').mockResolvedValue({});
                const flujo = await iniciar('/auth/linkedin/vincular?volverA=//evil.com', cookieDeSesion(roles.COLABORADOR));

                const url = redireccion(await volver(flujo));

                expect(url.origin + url.pathname).toBe(`${FRONT}/colaboradoras/datos-personales`);
            });

            test('con un state que no coincide no canjea el código', async () => {
                const flujo = await iniciar(ruta, cookieDeSesion(roles.COLABORADOR));

                const res = await volver({ ...flujo, state: 'otro' });

                expect(redireccion(res).searchParams.get('errorLinkedin')).toMatch(/no es válida/);
                expect(linkedinService.canjearCodigo).not.toHaveBeenCalled();
            });
        });

        describe('ingresando', () => {
            test('inicia sesión y guarda el token', async () => {
                const ingresar = jest.spyOn(AuthService.prototype, 'ingresarConLinkedin')
                    .mockResolvedValue({ id: ID_USUARIO, username: 'ana', rol: roles.COLABORADOR });
                jest.spyOn(colaboradorService, 'buscarPorUsuario').mockResolvedValue({ id: 'perfil' });
                const flujo = await iniciar('/auth/linkedin');

                const res = await volver(flujo);

                expect(ingresar).toHaveBeenCalledWith(datos, token);
                expect(redireccion(res).pathname).toBe('/colaboradoras/inicio');
                expect(cookieDe(res, 'accessToken')).toBeTruthy();
            });

            test('sin la cookie del state vuelve al login con error', async () => {
                const res = await request(app).get('/auth/linkedin/callback?code=abc&state=xyz');

                const url = redireccion(res);
                expect(url.pathname).toBe('/ingresar');
                expect(url.searchParams.get('errorLinkedin')).toBeTruthy();
            });
        });
    });
});
