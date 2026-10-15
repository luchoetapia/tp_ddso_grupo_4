const Logro = require('../../../src/models/Logro.js');

describe('Logro', () => {
    test('asigna todos los atributos del constructor', () => {
        const logro = new Logro(1, 'MVP', 'Primera versión');

        expect(logro).toEqual({ id: 1, titulo: 'MVP', descripcion: 'Primera versión' });
    });
});
