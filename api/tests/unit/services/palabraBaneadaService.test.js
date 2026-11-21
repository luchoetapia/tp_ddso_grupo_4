jest.mock('../../../src/repositories/palabraBaneadaRepository', () => ({
    listadoPalabrasBaneadas: jest.fn()
}));

const palabraBaneadaRepository = require('../../../src/repositories/palabraBaneadaRepository');
const palabraBaneadaService = require('../../../src/services/palabraBaneadaSevice.js');

describe('PalabraBaneadaService.detectar', () => {
    beforeEach(() => {
        palabraBaneadaRepository.listadoPalabrasBaneadas.mockResolvedValue(['tonto', 'feo']);
    });

    test('devuelve las palabras baneadas que aparecen en el texto', async () => {
        expect(await palabraBaneadaService.detectar('Qué proyecto tonto y feo')).toEqual(['tonto', 'feo']);
    });

    test('detecta mayúsculas, tildes, leet y letras repetidas', async () => {
        expect(await palabraBaneadaService.detectar('Sos un T0NTOOOO')).toEqual(['tonto']);
        expect(await palabraBaneadaService.detectar('fé0')).toEqual(['feo']);
    });

    test('no detecta la palabra dentro de otra', async () => {
        expect(await palabraBaneadaService.detectar('El trofeo es lindo, tontolandia')).toEqual([]);
    });

    test('devuelve lista vacía sin consultar la bd si no hay texto', async () => {
        palabraBaneadaRepository.listadoPalabrasBaneadas.mockClear();
        expect(await palabraBaneadaService.detectar('')).toEqual([]);
        expect(palabraBaneadaRepository.listadoPalabrasBaneadas).not.toHaveBeenCalled();
    });
});

describe('PalabraBaneadaService.detectarEnCampos', () => {
    beforeEach(() => {
        palabraBaneadaRepository.listadoPalabrasBaneadas.mockReset().mockResolvedValue(['tonto', 'feo']);
    });

    test('devuelve solo los campos con palabras baneadas, con una sola consulta', async () => {
        const resultado = await palabraBaneadaService.detectarEnCampos({ titulo: 'Proyecto tonto', descripcion: 'todo bien', ubicacion: 'FEO lugar' });

        expect(resultado).toEqual({ titulo: ['tonto'], ubicacion: ['feo'] });
        expect(palabraBaneadaRepository.listadoPalabrasBaneadas).toHaveBeenCalledTimes(1);
    });

    test('ignora campos vacíos o que no son texto y no consulta si no queda ninguno', async () => {
        await expect(palabraBaneadaService.detectarEnCampos({ a: null, b: '', c: undefined })).resolves.toEqual({});
        expect(palabraBaneadaRepository.listadoPalabrasBaneadas).not.toHaveBeenCalled();
    });
});
