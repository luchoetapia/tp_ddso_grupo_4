import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/services/sesion', () => ({ default: { obtenerUsuario: vi.fn().mockResolvedValue(null) } }));

import { CODIGO_DUPLICADO, CODIGO_NO_VINCULADO, borrador, conectarLinkedin, esNoVinculado, textoSugerido, urlSiEsDuplicado } from '@/services/linkedin';

describe('services/linkedin', () => {
    beforeEach(() => sessionStorage.clear());

    test('esNoVinculado reconoce el 403 con el código de la API', () => {
        expect(esNoVinculado({ status: 403, detalles: [{ codigo: CODIGO_NO_VINCULADO }] })).toBe(true);
        expect(esNoVinculado({ status: 403, detalles: [] })).toBe(false);
        expect(esNoVinculado({ status: 400, detalles: [{ codigo: CODIGO_NO_VINCULADO }] })).toBe(false);
        expect(esNoVinculado(null)).toBe(false);
    });

    test('urlSiEsDuplicado devuelve el link al post existente', () => {
        expect(urlSiEsDuplicado({ status: 409, detalles: [{ codigo: CODIGO_DUPLICADO, url: 'https://x' }] })).toBe('https://x');
        expect(urlSiEsDuplicado({ status: 409, detalles: [] })).toBeNull();
        expect(urlSiEsDuplicado({ status: 403, detalles: [{ codigo: CODIGO_DUPLICADO, url: 'https://x' }] })).toBeNull();
    });

    test('textoSugerido incluye el proyecto, el rol y el link', () => {
        const texto = textoSugerido({ titulo: 'Aula Virtual', perfil: 'Backend', idProyecto: 'abc' });

        expect(texto).toContain('"Aula Virtual" como Backend');
        expect(texto).toContain(`${window.location.origin}/proyectos/ver?id=abc`);
    });

    test('borrador se guarda, se lee y se borra por proyecto', () => {
        borrador.guardar('p1', 'hola');

        expect(borrador.leer('p1')).toBe('hola');
        expect(borrador.leer('p2')).toBeNull();
        borrador.borrar('p1');
        expect(borrador.leer('p1')).toBeNull();
    });

    test('conectarLinkedin navega a vincular volviendo a la pantalla actual', async () => {
        const assign = vi.fn();
        vi.stubGlobal('location', { ...window.location, pathname: '/proyectos/ver', search: '?id=abc', assign });

        await conectarLinkedin({ publicar: 'abc' });

        const url = new URL(assign.mock.calls[0][0], 'http://x');
        expect(url.pathname).toBe('/api/auth/linkedin/vincular');
        expect(url.searchParams.get('volverA')).toBe('/proyectos/ver?id=abc');
        expect(url.searchParams.get('publicar')).toBe('abc');
        vi.unstubAllGlobals();
    });
});
