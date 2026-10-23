const { objectId, alMenosUnCampo } = require('../../../src/validators/comunes.js');
const { validarCreacionColaboracion, validarActualizacionColaboracion } = require('../../../src/validators/colaboracionValidator.js');
const {
    validarCreacionColaborador, validarActualizacionColaborador, validarCuentaGitColaborador, validarAnotacionAProyecto,
} = require('../../../src/validators/colaboradoresValidator.js');
const { validarCreacionColectivo, validarActualizacionColectivo, validarFiltrosColectivo } = require('../../../src/validators/colectivosValidator.js');
const { validarCreacionHabilidad, validarActualizacionHabilidad } = require('../../../src/validators/habilidadesValidator.js');
const { validarCreacionLogro, validarActualizacionLogro, validarIdsLogro } = require('../../../src/validators/logrosValidator.js');
const {
    validarCreacionPerfil, validarActualizacionPerfil,
    validarCreacionProyecto, validarActualizacionProyecto, validarFinalizacionProyecto, validarContactoColaborador,
    validarIdsPerfilDeProyecto,
} = require('../../../src/validators/proyectosValidator.js');

const ID = '507f1f77bcf86cd799439011';
const ID_2 = '507f1f77bcf86cd799439012';

const esValido = (schema, datos) => schema.safeParse(datos).success;

describe('Validadores', () => {
    describe('comunes', () => {
        test('objectId acepta 24 caracteres hexadecimales', () => {
            expect(esValido(objectId('x'), ID)).toBe(true);
        });

        test.each(['123', 'zzzzzzzzzzzzzzzzzzzzzzzz', 123, undefined])('objectId rechaza %p', (valor) => {
            expect(esValido(objectId('x'), valor)).toBe(false);
        });

        test('objectId usa el mensaje indicado', () => {
            expect(objectId('Id malo').safeParse('123').error.issues[0].message).toBe('Id malo');
        });

        test('alMenosUnCampo exige al menos una clave', () => {
            const [predicado, mensaje] = alMenosUnCampo;

            expect(predicado({})).toBe(false);
            expect(predicado({ a: 1 })).toBe(true);
            expect(mensaje).toMatch(/al menos un campo/);
        });
    });

    describe('colaboración', () => {
        test('creación válida', () => {
            expect(esValido(validarCreacionColaboracion, { idProyecto: ID, idColaborador: ID_2 })).toBe(true);
        });

        test('creación rechaza campos extra o ids inválidos', () => {
            expect(esValido(validarCreacionColaboracion, { idProyecto: ID, idColaborador: ID_2, extra: 1 })).toBe(false);
            expect(esValido(validarCreacionColaboracion, { idProyecto: 'x', idColaborador: ID_2 })).toBe(false);
        });

        test('actualización exige al menos un campo y fecha ISO', () => {
            expect(esValido(validarActualizacionColaboracion, {})).toBe(false);
            expect(esValido(validarActualizacionColaboracion, { esAnonima: true })).toBe(true);
            expect(esValido(validarActualizacionColaboracion, { fin: '2024-01-01T00:00:00Z' })).toBe(true);
            expect(esValido(validarActualizacionColaboracion, { fin: null })).toBe(true);
            expect(esValido(validarActualizacionColaboracion, { fin: 'ayer' })).toBe(false);
        });
    });

    describe('colaborador', () => {
        const valido = { nombre: 'Juan', apellido: 'Pérez', cuentaGit: 'juan-p.dev' };

        test('creación aplica defaults', () => {
            expect(validarCreacionColaborador.parse(valido)).toEqual({
                ...valido, habilidades: [], deseaSerContactado: false, contactos: [],
            });
        });

        test('creación acepta contactos válidos', () => {
            expect(esValido(validarCreacionColaborador, { ...valido, contactos: [{ medio: 'Email', valor: 'a@b.com' }] })).toBe(true);
        });

        test.each([
            ['sin nombre', { apellido: 'P', cuentaGit: 'jp' }],
            ['nombre vacío', { ...valido, nombre: '' }],
            ['cuentaGit con espacios', { ...valido, cuentaGit: 'juan p' }],
            ['cuentaGit muy larga', { ...valido, cuentaGit: 'a'.repeat(40) }],
            ['medio de contacto inválido', { ...valido, contactos: [{ medio: 'Fax', valor: '1' }] }],
            ['presentación muy larga', { ...valido, presentacion: 'a'.repeat(301) }],
            ['habilidad inválida', { ...valido, habilidades: ['x'] }],
            ['campo extra', { ...valido, edad: 30 }],
        ])('creación rechaza: %s', (_, datos) => {
            expect(esValido(validarCreacionColaborador, datos)).toBe(false);
        });

        test('actualización exige al menos un campo', () => {
            expect(esValido(validarActualizacionColaborador, {})).toBe(false);
            expect(esValido(validarActualizacionColaborador, { nombre: 'Ana' })).toBe(true);
        });

        test('params de cuentaGit y anotación', () => {
            expect(esValido(validarCuentaGitColaborador, { cuentaGit: 'juanp' })).toBe(true);
            expect(esValido(validarAnotacionAProyecto, { cuentaGit: 'juanp', idProyecto: ID })).toBe(true);
            expect(esValido(validarAnotacionAProyecto, { cuentaGit: 'juanp', idProyecto: '1' })).toBe(false);
        });
    });

    describe('colectivo', () => {
        test('creación válida con defaults', () => {
            expect(validarCreacionColectivo.parse({ nombre: 'C', tipo: 'ong' })).toEqual({ nombre: 'C', tipo: 'ong', proyectos: [] });
        });

        test('creación rechaza tipo inválido o nombre vacío', () => {
            expect(esValido(validarCreacionColectivo, { nombre: 'C', tipo: 'club' })).toBe(false);
            expect(esValido(validarCreacionColectivo, { nombre: '', tipo: 'ong' })).toBe(false);
        });

        test('actualización exige al menos un campo', () => {
            expect(esValido(validarActualizacionColectivo, {})).toBe(false);
            expect(esValido(validarActualizacionColectivo, { ubicacion: 'CABA' })).toBe(true);
        });

        test('filtros aceptan activos true/false u omitido', () => {
            expect(esValido(validarFiltrosColectivo, {})).toBe(true);
            expect(esValido(validarFiltrosColectivo, { activos: 'true' })).toBe(true);
            expect(esValido(validarFiltrosColectivo, { activos: 'false' })).toBe(true);
            expect(esValido(validarFiltrosColectivo, { activos: 'si' })).toBe(false);
        });
    });

    describe('habilidad', () => {
        const valida = { titulo: 'JS', tipoHabilidad: 'programacion', descripcion: 'Lenguaje' };

        test('creación válida', () => {
            expect(esValido(validarCreacionHabilidad, valida)).toBe(true);
        });

        test('creación rechaza tipo inválido o descripción faltante', () => {
            expect(esValido(validarCreacionHabilidad, { ...valida, tipoHabilidad: 'cocina' })).toBe(false);
            expect(esValido(validarCreacionHabilidad, { titulo: 'JS', tipoHabilidad: 'programacion' })).toBe(false);
        });

        test('actualización exige al menos un campo', () => {
            expect(esValido(validarActualizacionHabilidad, {})).toBe(false);
            expect(esValido(validarActualizacionHabilidad, { titulo: 'TS' })).toBe(true);
        });
    });

    describe('logro', () => {
        test('creación exige título y descripción no vacíos', () => {
            expect(esValido(validarCreacionLogro, { titulo: 'MVP', descripcion: 'd' })).toBe(true);
            expect(esValido(validarCreacionLogro, { titulo: '', descripcion: 'd' })).toBe(false);
            expect(esValido(validarCreacionLogro, { titulo: 'MVP' })).toBe(false);
        });

        test('actualización acepta campos parciales', () => {
            expect(esValido(validarActualizacionLogro, { titulo: 'Nuevo' })).toBe(true);
            expect(esValido(validarActualizacionLogro, { otro: 'x' })).toBe(false);
        });

        test('params exigen ids válidos', () => {
            expect(esValido(validarIdsLogro, { id: ID, idLogro: ID_2 })).toBe(true);
            expect(esValido(validarIdsLogro, { id: ID, idLogro: 'x' })).toBe(false);
        });
    });

    describe('perfil', () => {
        const valido = {
            titulo: 'Backend',
            descripcion: 'Backend Node.js',
            tipoCompromiso: { cantHoras: 10, periodo: 'semanal' },
            modalidadColaboracion: {},
        };

        test('creación aplica defaults', () => {
            expect(validarCreacionPerfil.parse(valido)).toEqual({
                ...valido,
                habilidadesRequeridas: [],
                habilidadesOpcionales: [],
                modalidadColaboracion: { incentivoEconomico: 0, posibleContratacion: false },
            });
        });

        test.each([
            ['sin título', { descripcion: 'x', tipoCompromiso: valido.tipoCompromiso, modalidadColaboracion: {} }],
            ['sin tipoCompromiso', { titulo: 'x', descripcion: 'x', modalidadColaboracion: {} }],
            ['horas negativas', { ...valido, tipoCompromiso: { cantHoras: -1, periodo: 'semanal' } }],
            ['período inválido', { ...valido, tipoCompromiso: { cantHoras: 1, periodo: 'anual' } }],
            ['incentivo negativo', { ...valido, modalidadColaboracion: { incentivoEconomico: -5 } }],
            ['sin modalidad', { titulo: 'x', descripcion: 'x', tipoCompromiso: valido.tipoCompromiso }],
        ])('creación rechaza: %s', (_, datos) => {
            expect(esValido(validarCreacionPerfil, datos)).toBe(false);
        });

        test('actualización no aplica defaults y exige al menos un campo', () => {
            expect(esValido(validarActualizacionPerfil, {})).toBe(false);
            expect(validarActualizacionPerfil.parse({ descripcion: 'Nuevo' })).toEqual({ descripcion: 'Nuevo' });
        });
    });

    describe('proyecto', () => {
        const valido = { titulo: 'Aula', descripcion: 'desc' };

        test('creación válida con defaults', () => {
            expect(validarCreacionProyecto.parse(valido)).toEqual({ ...valido, perfiles: [] });
        });

        test('creación exige perfiles completos, no ids', () => {
            const perfil = { titulo: 'Backend', descripcion: 'x', tipoCompromiso: { cantHoras: 1, periodo: 'total' }, modalidadColaboracion: {} };

            expect(esValido(validarCreacionProyecto, { ...valido, perfiles: [perfil] })).toBe(true);
            expect(esValido(validarCreacionProyecto, { ...valido, perfiles: [ID] })).toBe(false);
        });

        test('creación valida URLs de enlaces', () => {
            expect(esValido(validarCreacionProyecto, { ...valido, enlaceSistema: 'https://aula.org' })).toBe(true);
            expect(esValido(validarCreacionProyecto, { ...valido, enlaceCodigoFuente: null })).toBe(true);
            expect(esValido(validarCreacionProyecto, { ...valido, enlaceSistema: 'no es url' })).toBe(false);
        });

        test('actualización exige al menos un campo', () => {
            expect(esValido(validarActualizacionProyecto, {})).toBe(false);
            expect(esValido(validarActualizacionProyecto, { titulo: 'Nuevo' })).toBe(true);
        });

        test('finalización exige idColectivo', () => {
            expect(esValido(validarFinalizacionProyecto, { idColectivo: ID })).toBe(true);
            expect(esValido(validarFinalizacionProyecto, {})).toBe(false);
        });

        test('contacto exige cuentaGit y mensaje', () => {
            expect(esValido(validarContactoColaborador, { cuentaGit: 'jp', mensaje: 'Hola' })).toBe(true);
            expect(esValido(validarContactoColaborador, { cuentaGit: 'jp', mensaje: '' })).toBe(false);
        });

        test('params de perfil de proyecto', () => {
            expect(esValido(validarIdsPerfilDeProyecto, { id: ID, idPerfil: ID_2 })).toBe(true);
            expect(esValido(validarIdsPerfilDeProyecto, { id: ID })).toBe(false);
        });
    });
});
