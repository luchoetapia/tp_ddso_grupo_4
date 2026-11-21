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
