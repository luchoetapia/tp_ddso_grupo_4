import { afterEach, describe, expect, it, vi } from 'vitest';
import alertas from '@/services/alertas';
import refreshSession from '@/services/api/refreshSession';

describe('refreshSession.redirigirALogin', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('deja una alerta diferida antes de ir al login', () => {
        const replace = vi.fn();
        vi.stubGlobal('location', { pathname: '/proyectos', search: '', replace });
        const diferir = vi.spyOn(alertas, 'diferir').mockImplementation(() => {});
        refreshSession.redirigirALogin();
        expect(diferir).toHaveBeenCalledWith('error', 'Tenés que iniciar sesión para continuar.');
        expect(replace).toHaveBeenCalledWith('/ingresar?redirect=%2Fproyectos');
    });
});
