jest.mock('../../../src/repositories/palabraBaneadaRepository', () => ({
    listadoPalabrasBaneadas: jest.fn(),
    listadoPalabrasBaneadasPaginadas: jest.fn(),
    obtenerPalabra: jest.fn(),
    agregarPalabra: jest.fn(),
    activarPalabra: jest.fn(),
    desactivarPalabra: jest.fn()
}));

const palabraBaneadaRepository = require('../../../src/repositories/palabraBaneadaRepository');
const palabraBaneadaService = require('../../../src/services/palabraBaneadaSevice.js');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID = '507f1f77bcf86cd799439061';

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

describe('PalabraBaneadaService administración', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('listar', () => {
        test('sin filtro de activa lista todas', async () => {
            await palabraBaneadaService.listar({ pagina: 2, limite: 5 });
            expect(palabraBaneadaRepository.listadoPalabrasBaneadasPaginadas).toHaveBeenCalledWith(2, 5, {});
        });

        test('filtra por activa, incluso cuando es false', async () => {
            await palabraBaneadaService.listar({ activa: false });
            expect(palabraBaneadaRepository.listadoPalabrasBaneadasPaginadas).toHaveBeenCalledWith(1, 10, { activa: false });
        });
    });

    describe('agregar', () => {
        test('guarda la palabra en minúscula y sin espacios', async () => {
            palabraBaneadaRepository.obtenerPalabra.mockResolvedValue(null);
            palabraBaneadaRepository.agregarPalabra.mockResolvedValue({ palabra: 'tonto' });

            await palabraBaneadaService.agregar('  Tonto ');

            expect(palabraBaneadaRepository.obtenerPalabra).toHaveBeenCalledWith('tonto');
            expect(palabraBaneadaRepository.agregarPalabra).toHaveBeenCalledWith('tonto');
        });

        test('409 si ya existe, avisando si está desactivada', async () => {
            palabraBaneadaRepository.obtenerPalabra.mockResolvedValue({ palabra: 'tonto', activa: false });

            const error = await palabraBaneadaService.agregar('tonto').catch(e => e);

            expect(error).toBeInstanceOf(ConflictError);
            expect(error.message).toContain('desactivada');
            expect(palabraBaneadaRepository.agregarPalabra).not.toHaveBeenCalled();
        });

        test('409 si otra alta simultánea choca con el índice único', async () => {
            palabraBaneadaRepository.obtenerPalabra.mockResolvedValue(null);
            palabraBaneadaRepository.agregarPalabra.mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 }));

            await expect(palabraBaneadaService.agregar('tonto')).rejects.toBeInstanceOf(ConflictError);
        });
    });

    describe.each([
        ['activar', 'activarPalabra'],
        ['desactivar', 'desactivarPalabra'],
    ])('%s', (metodo, metodoRepo) => {
        test('devuelve la palabra actualizada', async () => {
            palabraBaneadaRepository[metodoRepo].mockResolvedValue({ id: ID });

            await expect(palabraBaneadaService[metodo](ID)).resolves.toEqual({ id: ID });
            expect(palabraBaneadaRepository[metodoRepo]).toHaveBeenCalledWith(ID);
        });

        test('400 con id inválido y 404 si no existe', async () => {
            await expect(palabraBaneadaService[metodo]('abc')).rejects.toBeInstanceOf(BadRequestError);

            palabraBaneadaRepository[metodoRepo].mockResolvedValue(null);
            await expect(palabraBaneadaService[metodo](ID)).rejects.toBeInstanceOf(NotFoundError);
        });
    });
});
