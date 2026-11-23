const { cifrar, descifrar } = require('../../../src/linkedin/cifrado.js');

describe('cifrado de tokens de LinkedIn', () => {
    const claveOriginal = process.env.LINKEDIN_TOKEN_KEY;
    beforeEach(() => { process.env.LINKEDIN_TOKEN_KEY = 'clave-de-prueba'; });
    afterAll(() => { process.env.LINKEDIN_TOKEN_KEY = claveOriginal; });

    test('descifrar devuelve el texto original y el cifrado no lo contiene', () => {
        const guardado = cifrar('token-secreto');

        expect(guardado).not.toContain('token-secreto');
        expect(descifrar(guardado)).toBe('token-secreto');
    });

    test('dos cifrados del mismo texto son distintos (iv aleatorio)', () => {
        expect(cifrar('abc')).not.toBe(cifrar('abc'));
    });

    test('falla si el valor guardado fue alterado', () => {
        const [iv, tag, dato] = cifrar('token-secreto').split('.');
        const alterado = [iv, tag, Buffer.from('otra-cosa').toString('base64url')].join('.');

        expect(() => descifrar(alterado)).toThrow();
        expect(dato).toBeDefined();
    });

    test('falla con otra clave', () => {
        const guardado = cifrar('token-secreto');
        process.env.LINKEDIN_TOKEN_KEY = 'otra-clave';

        expect(() => descifrar(guardado)).toThrow();
    });

    test('exige LINKEDIN_TOKEN_KEY', () => {
        delete process.env.LINKEDIN_TOKEN_KEY;

        expect(() => cifrar('x')).toThrow('LINKEDIN_TOKEN_KEY');
    });
});
