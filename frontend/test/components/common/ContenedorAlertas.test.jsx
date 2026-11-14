import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import alertas from '@/services/alertas';
import ContenedorAlertas from '@/components/common/ContenedorAlertas';
import Toast from '@/components/common/Toast';

describe('ContenedorAlertas', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        alertas._reiniciar();
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('muestra una alerta de error con role alert', () => {
        render(<ContenedorAlertas />);
        act(() => alertas.error('Falló'));
        expect(screen.getByRole('alert').textContent).toContain('Falló');
    });

    it('info usa role status', () => {
        render(<ContenedorAlertas />);
        act(() => alertas.info('Hola'));
        expect(screen.getByRole('status').textContent).toContain('Hola');
    });

    it('el botón cerrar la quita', () => {
        render(<ContenedorAlertas />);
        act(() => alertas.info('Hola'));
        fireEvent.click(screen.getByRole('button', { name: 'Cerrar alerta' }));
        expect(screen.queryByText('Hola')).toBeNull();
    });

    it('desaparece a los 10 segundos', () => {
        render(<ContenedorAlertas />);
        act(() => alertas.exito('Guardado'));
        act(() => vi.advanceTimersByTime(10000));
        expect(screen.queryByText('Guardado')).toBeNull();
    });

    it('el contenedor existe antes de la primera alerta y no es una región live', () => {
        const { container } = render(<ContenedorAlertas />);
        expect(container.firstChild).not.toBeNull();
        expect(container.firstChild.getAttribute('aria-live')).toBeNull();
    });

    it('muestra al montarse las alertas diferidas antes de una recarga', () => {
        sessionStorage.clear();
        alertas.diferir('error', 'Tenés que iniciar sesión para continuar.');
        render(<ContenedorAlertas />);
        expect(screen.getByRole('alert').textContent).toContain('Tenés que iniciar sesión para continuar.');
    });

    it('Toast sin onClose no tiene botón y acepta type ok', () => {
        render(<Toast type="ok">Listo</Toast>);
        expect(screen.getByRole('status').textContent).toContain('Listo');
        expect(screen.queryByRole('button')).toBeNull();
    });
});
