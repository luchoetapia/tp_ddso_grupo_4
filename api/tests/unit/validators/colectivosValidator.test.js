const { validarCreacionColectivo, validarActualizacionColectivo } = require('../../../src/validators/colectivosValidator.js');
const { normalizarUbicacion, UBICACIONES_PREDEFINIDAS } = require('../../../src/models/colectivo.js');

const base = { nombre: 'Tech For Good', tipo: 'fundacion', descripcion: 'Proyectos con impacto social' };

describe('Validación de colectivos', () => {
    describe('descripción (obligatoria según el enunciado)', () => {
        test('la creación exige descripción', () => {
            const { descripcion, ...sinDescripcion } = base;

            expect(validarCreacionColectivo.safeParse(sinDescripcion).success).toBe(false);
            expect(validarCreacionColectivo.safeParse(base).success).toBe(true);
        });

        test('no acepta una descripción vacía o solo con espacios', () => {
            expect(validarCreacionColectivo.safeParse({ ...base, descripcion: '   ' }).success).toBe(false);
            expect(validarActualizacionColectivo.safeParse({ descripcion: '' }).success).toBe(false);
        });

        test('recorta los espacios de la descripción', () => {
            const { data } = validarCreacionColectivo.safeParse({ ...base, descripcion: '  Hola  ' });

            expect(data.descripcion).toBe('Hola');
        });
    });

    describe('ubicación', () => {
        test('es opcional', () => {
            const { success, data } = validarCreacionColectivo.safeParse(base);

            expect(success).toBe(true);
            expect(data.ubicacion).toBeUndefined();
        });

        test('acepta las predefinidas y las guarda con su nombre oficial', () => {
            const parsear = (ubicacion) => validarCreacionColectivo.parse({ ...base, ubicacion }).ubicacion;

            expect(parsear('Argentina')).toBe('Argentina');
            expect(parsear('caba')).toBe('CABA');
            expect(parsear('cordoba')).toBe('Córdoba');
            expect(parsear('  TIERRA DEL FUEGO ')).toBe('Tierra del Fuego');
        });

        test('acepta una ciudad o barrio en texto libre sin modificarlo', () => {
            const { data } = validarCreacionColectivo.safeParse({ ...base, ubicacion: 'Villa Crespo' });

            expect(data.ubicacion).toBe('Villa Crespo');
        });

        test('vacía o null se guarda como null (permite borrarla al editar)', () => {
            expect(validarActualizacionColectivo.parse({ ubicacion: '' }).ubicacion).toBeNull();
            expect(validarActualizacionColectivo.parse({ ubicacion: null }).ubicacion).toBeNull();
        });

        test('rechaza textos de más de 100 caracteres', () => {
            expect(validarCreacionColectivo.safeParse({ ...base, ubicacion: 'x'.repeat(101) }).success).toBe(false);
        });
    });

    describe('normalizarUbicacion', () => {
        test('hay 25 ubicaciones predefinidas: Argentina, CABA y las 23 provincias', () => {
            expect(UBICACIONES_PREDEFINIDAS).toHaveLength(25);
        });

        test('ignora tildes y mayúsculas', () => {
            expect(normalizarUbicacion('NEUQUEN')).toBe('Neuquén');
            expect(normalizarUbicacion('entre rios')).toBe('Entre Ríos');
        });

        test('deja como está lo que no es predefinido', () => {
            expect(normalizarUbicacion('Rosario')).toBe('Rosario');
        });
    });
});
