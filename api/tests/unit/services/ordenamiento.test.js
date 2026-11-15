const { construirOrden } = require('../../../src/services/ordenamiento.js');
const { BadRequestError } = require('../../../src/errors/AppError.js');

const config = {
    campos: { titulo: 'titulo', fechaCreacion: 'createdAt' },
    campoNombre: 'titulo',
    porDefecto: { orden: 'fechaCreacion', direccion: 'desc' },
};

describe('construirOrden', () => {
    test('sin orden usa el orden y la dirección por defecto', () => {
        expect(construirOrden(config)).toEqual({ createdAt: -1, titulo: 1, _id: 1 });
    });

    test('con orden y sin dirección ordena ascendente', () => {
        expect(construirOrden(config, { orden: 'fechaCreacion' })).toEqual({ createdAt: 1, titulo: 1, _id: 1 });
    });

    test('con dirección y sin orden aplica la dirección al orden por defecto', () => {
        expect(construirOrden(config, { direccion: 'asc' })).toEqual({ createdAt: 1, titulo: 1, _id: 1 });
    });

    test('mantiene el orden de prioridad: campo elegido, nombre, _id', () => {
        expect(Object.keys(construirOrden(config, { orden: 'fechaCreacion' }))).toEqual(['createdAt', 'titulo', '_id']);
    });

    test('si se ordena por el nombre no lo repite como segundo criterio', () => {
        expect(construirOrden(config, { orden: 'titulo', direccion: 'desc' })).toEqual({ titulo: -1, _id: 1 });
    });

    test('sin campo de nombre desempata directo por _id', () => {
        expect(construirOrden({ ...config, campoNombre: null }, { orden: 'fechaCreacion' })).toEqual({ createdAt: 1, _id: 1 });
    });

    test.each(['contactos', 'constructor', 'toString'])('rechaza la clave %p con las opciones válidas', (orden) => {
        expect(() => construirOrden(config, { orden })).toThrow(BadRequestError);
        try {
            construirOrden(config, { orden });
        } catch (error) {
            expect(error.details).toEqual({ opciones: ['titulo', 'fechaCreacion'] });
        }
    });
});
