const { Colectivo, TipoColectivo } = require('../../../src/models/colectivo.js');
const { Proyecto, TipoCompromiso, ModalidadColaboracion, Periodo } = require('../../../src/models/proyecto.js');
const { Habilidad, TipoHabilidad } = require('../../../src/models/habilidad.js');
const { Colaborador } = require('../../../src/models/colaborador.js');
const { Colaboracion } = require('../../../src/models/colaboracion.js');

describe('Modelos de dominio', () => {
    describe('Colectivo', () => {
        test('asigna todos los atributos del constructor', () => {
            const colectivo = new Colectivo(1, 'usr1', 'Nombre', 'Desc', 'CABA', TipoColectivo.ONG, ['p1']);

            expect(colectivo).toEqual({
                id: 1,
                usuario: 'usr1',
                nombre: 'Nombre',
                descripcion: 'Desc',
                ubicacion: 'CABA',
                tipo: 'ong',
                proyectos: ['p1'],
            });
        });
    });

    describe('Proyecto', () => {
        test('usa valores por defecto para finalizado, porcentaje y logros', () => {
            const proyecto = new Proyecto(1, 'Titulo', 'Desc', []);

            expect(proyecto.finalizado).toBe(false);
            expect(proyecto.porcentajeFinalizado).toBe(0);
            expect(proyecto.logros).toEqual([]);
            expect(proyecto.enlaceSistema).toBeUndefined();
            expect(proyecto.enlaceCodigoFuente).toBeUndefined();
        });

        test('respeta los valores explícitos', () => {
            const proyecto = new Proyecto(1, 'T', 'D', ['perfil'], true, 100, 'http://sis', 'http://git', ['logro']);

            expect(proyecto).toEqual({
                id: 1,
                titulo: 'T',
                descripcion: 'D',
                perfiles: ['perfil'],
                finalizado: true,
                porcentajeFinalizado: 100,
                enlaceSistema: 'http://sis',
                enlaceCodigoFuente: 'http://git',
                logros: ['logro'],
            });
        });
    });

    describe('TipoCompromiso', () => {
        test('guarda horas y período', () => {
            const tipo = new TipoCompromiso(10, Periodo.SEMANAL);

            expect(tipo.cantHoras).toBe(10);
            expect(tipo.periodo).toBe('semanal');
        });
    });

    describe('Habilidad', () => {
        test('asigna todos los atributos', () => {
            const habilidad = new Habilidad(1, 'JS', TipoHabilidad.PROGRAMACION, 'Lenguaje');

            expect(habilidad).toEqual({ id: 1, titulo: 'JS', tipoHabilidad: 'programacion', descripcion: 'Lenguaje' });
        });
    });

    describe('Colaborador', () => {
        test('asigna todos los atributos', () => {
            const colaborador = new Colaborador('usr2', 'Juan', 'Pérez', 'Juani', 'juanp', ['h1'], 'él', 'Hola', true, ['c1']);

            expect(colaborador).toEqual({
                usuario: 'usr2',
                nombre: 'Juan',
                apellido: 'Pérez',
                nombreFantasia: 'Juani',
                cuentaGit: 'juanp',
                habilidades: ['h1'],
                pronombres: 'él',
                presentacion: 'Hola',
                deseaSerContactado: true,
                contactos: ['c1'],
            });
        });
    });

    describe('Colaboracion', () => {
        test('por defecto no es anónima y no tiene fin', () => {
            const inicio = new Date();
            const colaboracion = new Colaboracion('colab', 'proy', undefined, inicio);

            expect(colaboracion.esAnonima).toBe(false);
            expect(colaboracion.inicio).toBe(inicio);
            expect(colaboracion.fin).toBeNull();
        });

        test('convierte valores falsy de fin a null', () => {
            const colaboracion = new Colaboracion('colab', 'proy', true, new Date(), undefined);

            expect(colaboracion.esAnonima).toBe(true);
            expect(colaboracion.fin).toBeNull();
        });

        test('conserva la fecha de fin si se informa', () => {
            const fin = new Date();
            const colaboracion = new Colaboracion('colab', 'proy', false, new Date(), fin);

            expect(colaboracion.fin).toBe(fin);
        });
    });

    describe('ModalidadColaboracion', () => {
        test('guarda incentivo y posible contratación', () => {
            const modalidad = new ModalidadColaboracion(1000, true);

            expect(modalidad.incentivoEconomico).toBe(1000);
            expect(modalidad.posibleContratacion).toBe(true);
        });
    });

    describe('Enums', () => {
        test('Periodo', () => {
            expect(Object.values(Periodo)).toEqual(['semanal', 'mensual', 'total']);
        });

        test('TipoColectivo', () => {
            expect(Object.values(TipoColectivo)).toEqual(['fundacion', 'asociacion_barrial', 'ong', 'asamblea']);
        });

        test('TipoHabilidad', () => {
            expect(Object.values(TipoHabilidad)).toEqual([
                'programacion', 'diseño', 'marketing', 'comunicacion', 'gestion_proyectos', 'colaboracion',
            ]);
        });
    });
});
