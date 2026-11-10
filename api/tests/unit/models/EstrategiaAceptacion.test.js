const { Proyecto, Perfil } = require('../../../src/models/proyecto.js');
const {
    EstrategiaAceptacion,
    RevisionManual,
    TodoSuma,
    HastaLlenarVacantes,
    obtenerEstrategia
} = require('../../../src/models/Proyecto/EsrtategiaAceptacion/index.js');
const Postulacion = require('../../../src/models/Proyecto/Postulaciones/Postulacion.js');
const EstadoPostulacion = require('../../../src/models/Proyecto/Postulaciones/EstadoPostulacion.js');
const { ConflictError, BadRequestError } = require('../../../src/errors/AppError.js');

describe('Estrategias de Aceptación de Postulaciones', () => {
    const crearPerfil = (id, limiteColaboraciones = null, busquedaAbierta = true) => ({
        _id: id,
        id,
        titulo: 'Desarrollador',
        limiteColaboraciones,
        busquedaAbierta
    });

    describe('EstrategiaAceptacion (clase base)', () => {
        test('lanza error al invocar métodos abstractos no implementados', () => {
            const estrategia = new EstrategiaAceptacion('Base');
            expect(() => estrategia.evaluarPostulacion({})).toThrow("Método abstracto 'evaluarPostulacion' debe ser implementado");
            expect(() => estrategia.aplicableAProyecto({})).toThrow("Método abstracto 'aplicableAProyecto' debe ser implementado");
        });
    });

    describe('RevisionManual', () => {
        test('es aplicable tanto si el proyecto tiene límite como si no', () => {
            const estrategia = new RevisionManual();
            const proyectoConLimite = new Proyecto(1, 'P1', 'D1', [crearPerfil('perf1', 2)]);
            const proyectoSinLimite = new Proyecto(2, 'P2', 'D2', [crearPerfil('perf2', null)]);

            expect(estrategia.aplicableAProyecto(proyectoConLimite)).toBe(true);
            expect(estrategia.aplicableAProyecto(proyectoSinLimite)).toBe(true);
        });

        test('evaluarPostulacion no modifica el estado de la postulación (queda Pendiente)', () => {
            const estrategia = new RevisionManual();
            const post = new Postulacion({ id: 'colab1' }, null, crearPerfil('perf1'));

            estrategia.evaluarPostulacion(post);
            expect(post.estado).toBe(EstadoPostulacion.PENDIENTE);
        });
    });

    describe('TodoSuma', () => {
        test('es aplicable sólo si el proyecto no tiene límite', () => {
            const estrategia = new TodoSuma();
            const proyectoSinLimite = new Proyecto(1, 'P1', 'D1', [crearPerfil('perf1', null)]);
            const proyectoConLimite = new Proyecto(2, 'P2', 'D2', [crearPerfil('perf2', 3)]);

            expect(estrategia.aplicableAProyecto(proyectoSinLimite)).toBe(true);
            expect(estrategia.aplicableAProyecto(proyectoConLimite)).toBe(false);
        });

        test('evaluarPostulacion pasa la postulación a Aceptada', () => {
            const estrategia = new TodoSuma();
            const post = new Postulacion({ id: 'colab1' }, null, crearPerfil('perf1'));

            estrategia.evaluarPostulacion(post);
            expect(post.estado).toBe(EstadoPostulacion.ACEPTADA);
        });
    });

    describe('HastaLlenarVacantes', () => {
        test('es aplicable sólo si el proyecto tiene límite en sus perfiles', () => {
            const estrategia = new HastaLlenarVacantes();
            const proyectoConLimite = new Proyecto(1, 'P1', 'D1', [crearPerfil('perf1', 2)]);
            const proyectoSinLimite = new Proyecto(2, 'P2', 'D2', [crearPerfil('perf2', null)]);

            expect(estrategia.aplicableAProyecto(proyectoConLimite)).toBe(true);
            expect(estrategia.aplicableAProyecto(proyectoSinLimite)).toBe(false);
        });

        test('hasta alcanzar el límite quedan pendientes; al alcanzarlo se aceptan todas, se cierra la búsqueda y las siguientes se rechazan', () => {
            const perfil = crearPerfil('perf1', 2, true);
            const proyecto = new Proyecto(1, 'P1', 'D1', [perfil]);
            proyecto.asignarEstrategia('HastaLlenarVacantes');

            const post1 = new Postulacion({ id: 'c1' }, proyecto, perfil);
            const post2 = new Postulacion({ id: 'c2' }, proyecto, perfil);
            const post3 = new Postulacion({ id: 'c3' }, proyecto, perfil);

            // 1. Primera postulación (1 de 2 vacantes)
            proyecto.asignarPostulacion(post1);
            expect(post1.estado).toBe(EstadoPostulacion.PENDIENTE);
            expect(perfil.busquedaAbierta).toBe(true);

            // 2. Segunda postulación (alcanza el límite de 2)
            proyecto.asignarPostulacion(post2);
            expect(post1.estado).toBe(EstadoPostulacion.ACEPTADA);
            expect(post2.estado).toBe(EstadoPostulacion.ACEPTADA);
            expect(perfil.busquedaAbierta).toBe(false);

            // 3. Tercera postulación (excede el límite)
            proyecto.asignarPostulacion(post3);
            expect(post3.estado).toBe(EstadoPostulacion.RECHAZADA);
        });
    });

    describe('Integración de Estrategias en Proyecto', () => {
        test('asignarEstrategia lanza ConflictError si la estrategia no es compatible con el proyecto', () => {
            const proyectoConLimite = new Proyecto(1, 'P1', 'D1', [crearPerfil('perf1', 2)]);
            const proyectoSinLimite = new Proyecto(2, 'P2', 'D2', [crearPerfil('perf2', null)]);

            expect(() => proyectoConLimite.asignarEstrategia('TodoSuma')).toThrow(ConflictError);
            expect(() => proyectoSinLimite.asignarEstrategia('HastaLlenarVacantes')).toThrow(ConflictError);
        });

        test('asignarEstrategia funciona correctamente con estrategias compatibles', () => {
            const proyectoSinLimite = new Proyecto(1, 'P1', 'D1', [crearPerfil('perf1', null)]);
            proyectoSinLimite.asignarEstrategia('TodoSuma');
            expect(proyectoSinLimite.estrategiaAceptacion).toBeInstanceOf(TodoSuma);

            const proyectoConLimite = new Proyecto(2, 'P2', 'D2', [crearPerfil('perf2', 2)]);
            proyectoConLimite.asignarEstrategia('HastaLlenarVacantes');
            expect(proyectoConLimite.estrategiaAceptacion).toBeInstanceOf(HastaLlenarVacantes);
        });

        test('asignarPostulacion vincula el proyecto y ejecuta evaluarPostulacion', () => {
            const proyecto = new Proyecto(1, 'P1', 'D1', [crearPerfil('perf1', null)]);
            proyecto.asignarEstrategia('TodoSuma');

            const post = new Postulacion({ id: 'c1' }, null, crearPerfil('perf1'));
            proyecto.asignarPostulacion(post);

            expect(post.proyecto).toBe(proyecto);
            expect(proyecto.postulaciones).toContain(post);
            expect(post.estado).toBe(EstadoPostulacion.ACEPTADA);
        });

        test('obtenerEstrategia lanza BadRequestError ante un nombre desconocido', () => {
            expect(() => obtenerEstrategia('EstrategiaInexistente')).toThrow(BadRequestError);
        });
    });
});
