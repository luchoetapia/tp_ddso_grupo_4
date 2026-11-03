const { Perfil } = require('../../../src/models/proyecto.js');

describe('Perfil', () => {
    const tipoCompromiso = { cantHoras: 10, periodo: 'semanal' };
    const modalidad = { incentivoEconomico: 0, posibleContratacion: false };
    const fechaFin = new Date();

    test('asigna todos los atributos del constructor', () => {
        const perfil = new Perfil(1, 'Backend', 'Desarrollo de la API', ['h1'], ['h2'], tipoCompromiso, modalidad, false, 3, fechaFin);
        expect(perfil).toEqual({
            id: 1,
            titulo: 'Backend',
            descripcion: 'Desarrollo de la API',
            habilidadesRequeridas: ['h1'],
            habilidadesOpcionales: ['h2'],
            tipoCompromiso,
            modalidadColaboracion: modalidad,
            busquedaAbierta: false,
            limiteColaboraciones: 3,
            fechaFinBusqueda: fechaFin
        });
    });

    describe('cumpleHabilidadesRequeridas', () => {
        test('es verdadero si el colaborador tiene todas las habilidades requeridas', () => {
            const perfil = new Perfil(1, 'Backend', 'Desarrollo de la API', ['h1', 'h2'], [], tipoCompromiso, modalidad);

            expect(perfil.cumpleHabilidadesRequeridas(['h1', 'h2', 'h3'])).toBe(true);
        });

        test('es falso si falta alguna habilidad requerida', () => {
            const perfil = new Perfil(1, 'Backend', 'Desarrollo de la API', ['h1', 'h2'], [], tipoCompromiso, modalidad);

            expect(perfil.cumpleHabilidadesRequeridas(['h1'])).toBe(false);
        });

        test('es verdadero si el perfil no requiere habilidades', () => {
            const perfil = new Perfil(1, 'Backend', 'Desarrollo de la API', [], [], tipoCompromiso, modalidad);

            expect(perfil.cumpleHabilidadesRequeridas([])).toBe(true);
        });

        test('acepta habilidades requeridas populadas (con _id)', () => {
            const perfil = new Perfil(1, 'Backend', 'Desarrollo de la API', [{ _id: 'h1', titulo: 'JS' }], [], tipoCompromiso, modalidad);

            expect(perfil.cumpleHabilidadesRequeridas(['h1'])).toBe(true);
            expect(perfil.cumpleHabilidadesRequeridas(['h2'])).toBe(false);
        });

        test('acepta habilidades requeridas como objetos con toString (ObjectId)', () => {
            const objectIdFalso = { toString: () => 'h1' };
            const perfil = new Perfil(1, 'Backend', 'Desarrollo de la API', [objectIdFalso], [], tipoCompromiso, modalidad);

            expect(perfil.cumpleHabilidadesRequeridas(['h1'])).toBe(true);
        });
    });
});
