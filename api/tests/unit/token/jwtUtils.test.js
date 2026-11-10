process.env.JWT_ACCESS_KEY = 'clave-access-test';
process.env.JWT_REFRESH_KEY = 'clave-refresh-test';

const jwt = require('jsonwebtoken');
const JwtUtils = require('../../../src/token/jwtUtils.js');

const usuario = { id: '507f1f77bcf86cd799439011', username: 'ana', rol: 'colectivo' };
const duracionDe = (token) => { const { exp, iat } = jwt.decode(token); return exp - iat; };

describe('JwtUtils - duración de los tokens', () => {
    const original = { access: process.env.JWT_ACCESS_TIME, refresh: process.env.JWT_REFRESH_TIME };

    const restaurar = (nombre, valor) => valor === undefined ? delete process.env[nombre] : (process.env[nombre] = valor);
    afterEach(() => {
        restaurar('JWT_ACCESS_TIME', original.access);
        restaurar('JWT_REFRESH_TIME', original.refresh);
    });

    test('usa 15m y 7d por defecto si no hay variables de entorno', () => {
        delete process.env.JWT_ACCESS_TIME;
        delete process.env.JWT_REFRESH_TIME;

        const utils = new JwtUtils();

        expect(utils.accessMs).toBe(15 * 60 * 1000);
        expect(utils.refreshMs).toBe(7 * 24 * 60 * 60 * 1000);
        expect(duracionDe(utils.generarAccessToken(usuario))).toBe(15 * 60);
        expect(duracionDe(utils.generarRefreshToken(usuario))).toBe(7 * 24 * 60 * 60);
    });

    test('toma los valores de JWT_ACCESS_TIME y JWT_REFRESH_TIME', () => {
        process.env.JWT_ACCESS_TIME = '30s';
        process.env.JWT_REFRESH_TIME = '2h';

        const utils = new JwtUtils();

        expect(utils.accessMs).toBe(30 * 1000);
        expect(utils.refreshMs).toBe(2 * 60 * 60 * 1000);
        expect(duracionDe(utils.generarAccessToken(usuario))).toBe(30);
        expect(duracionDe(utils.generarRefreshToken(usuario))).toBe(2 * 60 * 60);
    });

    test('la duración del token y los ms de la cookie salen del mismo valor', () => {
        process.env.JWT_ACCESS_TIME = '45m';

        const utils = new JwtUtils();

        expect(duracionDe(utils.generarAccessToken(usuario)) * 1000).toBe(utils.accessMs);
    });

    test('una variable vacía usa el valor por defecto', () => {
        process.env.JWT_ACCESS_TIME = '   ';

        expect(new JwtUtils().accessMs).toBe(15 * 60 * 1000);
    });

    test.each(['abc', '15', '0m', '-5m', '1.5h', '15 minutos', '10x'])('rechaza el valor inválido "%s"', (valor) => {
        process.env.JWT_ACCESS_TIME = valor;

        expect(() => new JwtUtils()).toThrow(/JWT_ACCESS_TIME inválida/);
    });

    test('rechaza un JWT_REFRESH_TIME inválido indicando la variable', () => {
        process.env.JWT_REFRESH_TIME = 'siempre';

        expect(() => new JwtUtils()).toThrow(/JWT_REFRESH_TIME inválida/);
    });
});
