jest.mock('../../../src/repositories/proyectoRepository.js', () => ({
    logrosDelProyecto: jest.fn(),
    agregarLogro: jest.fn(),
    modificarLogro: jest.fn(),
    eliminarLogro: jest.fn(),
}));

const proyectoRepository = require('../../../src/repositories/proyectoRepository.js');
const logroService = require('../../../src/services/logroService.js');
const { BadRequestError, NotFoundError } = require('../../../src/errors/AppError.js');

const ID_PROY = '507f1f77bcf86cd799439041';
const ID_LOGRO = '507f1f77bcf86cd799439071';
const ID_LOGRO_2 = '507f1f77bcf86cd799439072';

// Simula un DocumentArray de mongoose, que expone .id() para buscar subdocumentos
const listaDeLogros = (...logros) => Object.assign([...logros], {
    id: (id) => logros.find(l => l.id === id) ?? null,
});

const logro = (id, titulo = 'MVP') => ({ id, titulo, descripcion: 'desc' });

describe('LogroService', () => {
    beforeEach(() => jest.resetAllMocks());

    describe('obtenerTodos', () => {
        test('devuelve los logros del proyecto', async () => {
            proyectoRepository.logrosDelProyecto.mockResolvedValue(listaDeLogros(logro(ID_LOGRO), logro(ID_LOGRO_2)));

            const resultado = await logroService.obtenerTodos(ID_PROY);

            expect(resultado.map(l => l.id)).toEqual([ID_LOGRO, ID_LOGRO_2]);
        });

        test('lanza BadRequestError con id inválido', async () => {
            await expect(logroService.obtenerTodos('malo')).rejects.toThrow(BadRequestError);
        });

        test('lanza NotFoundError si el proyecto no existe', async () => {
            proyectoRepository.logrosDelProyecto.mockResolvedValue(null);

            await expect(logroService.obtenerTodos(ID_PROY)).rejects.toThrow(NotFoundError);
        });
    });

    describe('obtenerPorId', () => {
        test('devuelve el logro buscado', async () => {
            proyectoRepository.logrosDelProyecto.mockResolvedValue(listaDeLogros(logro(ID_LOGRO)));

            await expect(logroService.obtenerPorId(ID_LOGRO, ID_PROY)).resolves.toMatchObject({ id: ID_LOGRO });
        });

        test.each([
            ['malo', ID_PROY],
            [ID_LOGRO, 'malo'],
        ])('lanza BadRequestError con ids inválidos (%s, %s)', async (idLogro, idProyecto) => {
            await expect(logroService.obtenerPorId(idLogro, idProyecto)).rejects.toThrow(BadRequestError);
        });

        test('lanza NotFoundError si el proyecto no existe', async () => {
            proyectoRepository.logrosDelProyecto.mockResolvedValue(null);

            await expect(logroService.obtenerPorId(ID_LOGRO, ID_PROY)).rejects.toThrow('Proyecto no encontrado');
        });

        test('lanza NotFoundError si el logro no existe', async () => {
            proyectoRepository.logrosDelProyecto.mockResolvedValue(listaDeLogros());

            await expect(logroService.obtenerPorId(ID_LOGRO, ID_PROY)).rejects.toThrow('Logro no encontrado');
        });
    });

    describe('crear', () => {
        test('agrega el logro y devuelve el último de la lista', async () => {
            proyectoRepository.agregarLogro.mockResolvedValue({
                logros: listaDeLogros(logro(ID_LOGRO), logro(ID_LOGRO_2, 'Nuevo')),
            });

            const resultado = await logroService.crear(ID_PROY, { titulo: 'Nuevo', descripcion: 'desc' });

            expect(proyectoRepository.agregarLogro).toHaveBeenCalledWith(ID_PROY, { titulo: 'Nuevo', descripcion: 'desc' });
            expect(resultado).toEqual({ id: ID_LOGRO_2, titulo: 'Nuevo', descripcion: 'desc' });
        });

        test('lanza BadRequestError con id inválido', async () => {
            await expect(logroService.crear('malo', {})).rejects.toThrow(BadRequestError);
        });

        test('lanza NotFoundError si el proyecto no existe', async () => {
            proyectoRepository.agregarLogro.mockResolvedValue(null);

            await expect(logroService.crear(ID_PROY, {})).rejects.toThrow(NotFoundError);
        });
    });

    describe('actualizar', () => {
        test('modifica el logro y lo devuelve', async () => {
            proyectoRepository.modificarLogro.mockResolvedValue({ logros: listaDeLogros(logro(ID_LOGRO, 'Editado')) });

            const resultado = await logroService.actualizar(ID_LOGRO, ID_PROY, { titulo: 'Editado' });

            expect(proyectoRepository.modificarLogro).toHaveBeenCalledWith(ID_PROY, ID_LOGRO, { titulo: 'Editado' });
            expect(resultado.titulo).toBe('Editado');
        });

        test('lanza BadRequestError con ids inválidos', async () => {
            await expect(logroService.actualizar('malo', ID_PROY, {})).rejects.toThrow(BadRequestError);
        });

        test('lanza NotFoundError si no existe el logro o el proyecto', async () => {
            proyectoRepository.modificarLogro.mockResolvedValue(null);

            await expect(logroService.actualizar(ID_LOGRO, ID_PROY, {})).rejects.toThrow(NotFoundError);
        });
    });

    describe('eliminar', () => {
        test('elimina el logro y devuelve un mensaje', async () => {
            proyectoRepository.eliminarLogro.mockResolvedValue({ logros: listaDeLogros() });

            await expect(logroService.eliminar(ID_LOGRO, ID_PROY))
                .resolves.toEqual({ mensaje: 'Logro eliminado correctamente' });
            expect(proyectoRepository.eliminarLogro).toHaveBeenCalledWith(ID_PROY, ID_LOGRO);
        });

        test('lanza BadRequestError con ids inválidos', async () => {
            await expect(logroService.eliminar(ID_LOGRO, 'malo')).rejects.toThrow(BadRequestError);
        });

        test('lanza NotFoundError si no existe el logro o el proyecto', async () => {
            proyectoRepository.eliminarLogro.mockResolvedValue(null);

            await expect(logroService.eliminar(ID_LOGRO, ID_PROY)).rejects.toThrow(NotFoundError);
        });
    });
});
