const { Notificacion } = require('../../../src/models/Notificacion.js');

describe('Notificacion', () => {
    test('asigna los atributos y usa la fecha actual por defecto', () => {
        const antes = new Date();
        const notificacion = new Notificacion(1, 'dest', 'proy', 'perfil', 'Hola');

        expect(notificacion.id).toBe(1);
        expect(notificacion.destinatario).toBe('dest');
        expect(notificacion.mensaje).toBe('Hola');
        expect(notificacion.fecha).toBeInstanceOf(Date);
        expect(notificacion.fecha.getTime()).toBeGreaterThanOrEqual(antes.getTime());
    });

    test('respeta la fecha informada', () => {
        const fecha = new Date('2024-01-01');
        const notificacion = new Notificacion(1, 'dest', 'proy', 'perfil', 'Hola', fecha);

        expect(notificacion.fecha).toBe(fecha);
    });

    describe('generarTexto', () => {
        test('incluye título del proyecto, descripción del perfil y mensaje', () => {
            const notificacion = new Notificacion(1, 'dest', { titulo: 'Aula Virtual' }, { descripcion: 'Backend' }, 'Sumate!');

            expect(notificacion.generarTexto())
                .toBe('El proyecto "Aula Virtual" te contactó por el perfil "Backend": Sumate!');
        });

        test('usa textos genéricos si proyecto y perfil no están populados', () => {
            const notificacion = new Notificacion(1, 'dest', 'idProyecto', null, 'Sumate!');

            expect(notificacion.generarTexto())
                .toBe('El proyecto "un proyecto" te contactó por el perfil "un perfil": Sumate!');
        });
    });
});
