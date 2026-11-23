const linkedinService = require('../../../src/linkedin/linkedinService.js');
const { escaparTexto, LinkedinNoVinculadoError, CODIGO_NO_VINCULADO } = linkedinService;
const { BadGatewayError } = require('../../../src/errors/AppError.js');

const respuesta = ({ status = 200, cuerpo = {}, cabeceras = {} } = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => cuerpo,
    headers: new Headers(cabeceras),
});

describe('linkedinService', () => {
    const envOriginal = { ...process.env };
    beforeEach(() => {
        process.env.LINKEDIN_CLIENT_ID = 'id';
        process.env.LINKEDIN_CLIENT_SECRET = 'secreto';
        process.env.LINKEDIN_REDIRECT_URI = 'http://localhost/api/auth/linkedin/callback';
        process.env.LINKEDIN_API_VERSION = '202610';
        global.fetch = jest.fn();
    });
    afterAll(() => { process.env = envOriginal; });

    test('urlDeAutorizacion pide el permiso para publicar', () => {
        const url = new URL(linkedinService.urlDeAutorizacion('abc'));

        expect(url.searchParams.get('scope')).toBe('openid profile email w_member_social');
        expect(url.searchParams.get('state')).toBe('abc');
    });

    describe('escaparTexto', () => {
        test('escapa los caracteres reservados de Little Text Format', () => {
            expect(escaparTexto('(a) [b] {c} <d> @e #f *g _h ~i |j \\k'))
                .toBe('\\(a\\) \\[b\\] \\{c\\} \\<d\\> \\@e \\#f \\*g \\_h \\~i \\|j \\\\k');
        });

        test('no toca el texto común, los acentos ni los links', () => {
            const texto = 'Colaboro en Código a Voluntad: https://ejemplo.com/proyectos/ver?id=1';
            expect(escaparTexto(texto)).toBe(texto);
        });
    });

    describe('canjearCodigo', () => {
        test('devuelve el token, su vencimiento y los scopes otorgados', async () => {
            fetch.mockResolvedValue(respuesta({ cuerpo: { access_token: 'tok', expires_in: 3600, scope: 'email,openid,profile,w_member_social' } }));
            const antes = Date.now();

            const token = await linkedinService.canjearCodigo('codigo');

            expect(token.accessToken).toBe('tok');
            expect(token.scopes).toEqual(['email', 'openid', 'profile', 'w_member_social']);
            expect(token.expiraEn.getTime()).toBeGreaterThanOrEqual(antes + 3600 * 1000);
        });

        test('sin access token responde BadGateway', async () => {
            fetch.mockResolvedValue(respuesta({ cuerpo: {} }));

            await expect(linkedinService.canjearCodigo('codigo')).rejects.toBeInstanceOf(BadGatewayError);
        });
    });

    describe('publicar', () => {
        test('manda el post con los headers de la API versionada y devuelve el id', async () => {
            fetch.mockResolvedValue(respuesta({ status: 201, cabeceras: { 'x-restli-id': 'urn:li:share:1' } }));

            const id = await linkedinService.publicar('tok', 'sub123', 'Hola (mundo)');

            expect(id).toBe('urn:li:share:1');
            const [url, opciones] = fetch.mock.calls[0];
            expect(url).toBe('https://api.linkedin.com/rest/posts');
            expect(opciones.method).toBe('POST');
            expect(opciones.headers).toMatchObject({
                Authorization: 'Bearer tok',
                'LinkedIn-Version': '202610',
                'X-Restli-Protocol-Version': '2.0.0',
            });
            const body = JSON.parse(opciones.body);
            expect(body).toMatchObject({
                author: 'urn:li:person:sub123',
                commentary: 'Hola \\(mundo\\)',
                visibility: 'PUBLIC',
                lifecycleState: 'PUBLISHED',
                distribution: { feedDistribution: 'MAIN_FEED' },
            });
        });

        test('un 401 de LinkedIn pide reconectar', async () => {
            fetch.mockResolvedValue(respuesta({ status: 401, cuerpo: { message: 'Expired' } }));

            const error = await linkedinService.publicar('tok', 'sub', 'hola').catch((e) => e);

            expect(error).toBeInstanceOf(LinkedinNoVinculadoError);
            expect(error.statusCode).toBe(403);
            expect(error.details).toEqual([{ codigo: CODIGO_NO_VINCULADO }]);
        });

        test('un texto repetido responde 409 con el link al post que ya existe', async () => {
            fetch.mockResolvedValue(respuesta({ status: 422, cuerpo: { message: 'Content is a duplicate of urn:li:share:7123' } }));

            const error = await linkedinService.publicar('tok', 'sub', 'hola').catch((e) => e);

            expect(error.statusCode).toBe(409);
            expect(error.details).toEqual([{ codigo: 'LINKEDIN_DUPLICADO', url: 'https://www.linkedin.com/feed/update/urn:li:share:7123/' }]);
        });

        test('otros errores de LinkedIn son BadGateway', async () => {
            fetch.mockResolvedValue(respuesta({ status: 422, cuerpo: { message: 'invalid' } }));

            await expect(linkedinService.publicar('tok', 'sub', 'hola')).rejects.toBeInstanceOf(BadGatewayError);
        });

        test('si LinkedIn no responde es BadGateway', async () => {
            fetch.mockRejectedValue(new Error('timeout'));

            await expect(linkedinService.publicar('tok', 'sub', 'hola')).rejects.toBeInstanceOf(BadGatewayError);
        });
    });
});
