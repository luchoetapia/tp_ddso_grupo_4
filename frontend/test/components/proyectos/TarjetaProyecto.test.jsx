import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TarjetaProyecto from '@/components/proyectos/TarjetaProyecto';

const proyectoBase = {
    id: '665f1c2b3a4d5e6f7a8b9c01',
    titulo: 'Sistema de turnos',
    descripcion: 'Turnos para la huerta',
    finalizado: false,
    porcentajeFinalizado: 40,
    perfiles: [],
    requiereRevisionManual: false,
};

describe('TarjetaProyecto: píldora de proyecto sin actualizaciones', () => {
    afterEach(() => {
        cleanup();
    });

    it('la muestra si el proyecto quedó marcado para revisión', () => {
        render(<TarjetaProyecto proyecto={{ ...proyectoBase, requiereRevisionManual: true }} />);
        expect(screen.getByText('Sin actualizaciones')).toBeTruthy();
    });

    it('no la muestra si el proyecto no está marcado', () => {
        render(<TarjetaProyecto proyecto={proyectoBase} />);
        expect(screen.queryByText('Sin actualizaciones')).toBeNull();
    });

    it('no la muestra si el proyecto está finalizado aunque tenga la marca', () => {
        render(<TarjetaProyecto proyecto={{ ...proyectoBase, requiereRevisionManual: true, finalizado: true }} />);
        expect(screen.queryByText('Sin actualizaciones')).toBeNull();
    });
});
