import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import alertas from '@/services/alertas';

describe('alertas', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        alertas._reiniciar();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('agrega una alerta por tipo', () => {
        const id = alertas.exito('Guardado');
        expect(alertas.obtener()).toEqual([{ id, tipo: 'exito', mensaje: 'Guardado' }]);
    });

    it('se cierra sola a los 10 segundos', () => {
        alertas.info('Hola');
        vi.advanceTimersByTime(9999);
        expect(alertas.obtener()).toHaveLength(1);
        vi.advanceTimersByTime(1);
        expect(alertas.obtener()).toEqual([]);
    });

    it('cerrar a mano cancela el temporizador', () => {
        const a = alertas.info('a');
        const b = alertas.aviso('b');
        alertas.cerrar(a);
        expect(alertas.obtener().map((x) => x.id)).toEqual([b]);
        expect(vi.getTimerCount()).toBe(1);
        vi.advanceTimersByTime(10000);
        expect(alertas.obtener()).toEqual([]);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('muestra como máximo 3 alertas', () => {
        alertas.info('1');
        alertas.info('2');
        alertas.info('3');
        alertas.info('4');
        expect(alertas.obtener().map((x) => x.mensaje)).toEqual(['2', '3', '4']);
        expect(vi.getTimerCount()).toBe(3);
    });

    it('no duplica alertas iguales y reinicia su tiempo', () => {
        alertas.error('Sin conexión');
        vi.advanceTimersByTime(5000);
        alertas.error('Sin conexión');
        expect(alertas.obtener()).toHaveLength(1);
        vi.advanceTimersByTime(9000);
        expect(alertas.obtener()).toHaveLength(1);
        vi.advanceTimersByTime(1000);
        expect(alertas.obtener()).toEqual([]);
    });

    it('ignora mensajes vacíos', () => {
        expect(alertas.info('')).toBeNull();
        expect(alertas.info(undefined)).toBeNull();
        expect(alertas.obtener()).toEqual([]);
    });

    it('devuelve una referencia estable mientras no hay cambios', () => {
        const antes = alertas.obtener();
        expect(alertas.obtener()).toBe(antes);
        alertas.info('x');
        expect(alertas.obtener()).not.toBe(antes);
    });

    it('notifica a los suscriptores', () => {
        const fn = vi.fn();
        const desuscribir = alertas.suscribir(fn);
        alertas.info('x');
        expect(fn).toHaveBeenCalledTimes(1);
        desuscribir();
        alertas.info('y');
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('alertas diferidas (sobreviven a una recarga)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        alertas._reiniciar();
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('guarda la alerta y la muestra al recuperarla una sola vez', () => {
        alertas.diferir('error', 'Tenés que iniciar sesión para continuar.');
        expect(alertas.obtener()).toEqual([]);
        alertas.recuperarDiferidas();
        expect(alertas.obtener()).toMatchObject([{ tipo: 'error', mensaje: 'Tenés que iniciar sesión para continuar.' }]);
        alertas._reiniciar();
        alertas.recuperarDiferidas();
        expect(alertas.obtener()).toEqual([]);
    });

    it('ignora datos corruptos en sessionStorage', () => {
        sessionStorage.setItem('alertasDiferidas', '{no es json');
        expect(() => alertas.recuperarDiferidas()).not.toThrow();
        expect(alertas.obtener()).toEqual([]);
    });
});
