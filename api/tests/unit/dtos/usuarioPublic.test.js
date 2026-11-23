const { UsuarioPublic } = require('../../../src/dtos/usuarioPublic.js');

const usuario = (linkedin) => ({ id: 'u1', username: 'ana', email: 'ana@mail.com', rol: 'colaborador', linkedin });
const enUnaHora = () => new Date(Date.now() + 3600 * 1000);

describe('UsuarioPublic.linkedin', () => {
    test('sin LinkedIn es null', () => {
        expect(UsuarioPublic.desde(usuario(undefined)).linkedin).toBeNull();
    });

    test('nunca expone el sub ni el token', () => {
        const { linkedin } = UsuarioPublic.desde(usuario({
            sub: 's', nombre: 'Ana', tokenCifrado: 'x', tokenExpiraEn: enUnaHora(), scopes: ['w_member_social'],
        }));

        expect(linkedin).toEqual({ nombre: 'Ana', apellido: null, foto: null, puedePublicar: true });
    });

    test.each([
        ['sin token', { sub: 's' }],
        ['con el token vencido', { sub: 's', tokenExpiraEn: new Date(Date.now() - 1000), scopes: ['w_member_social'] }],
        ['sin el permiso para publicar', { sub: 's', tokenExpiraEn: enUnaHora(), scopes: ['openid'] }],
    ])('%s no puede publicar', (_, linkedin) => {
        expect(UsuarioPublic.desde(usuario(linkedin)).linkedin.puedePublicar).toBe(false);
    });
});
