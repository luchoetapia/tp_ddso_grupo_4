import axios, { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import alertas from '@/services/alertas';
import apiQuery from '@/services/api/apiQuery';
import refreshSession from '@/services/api/refreshSession';

// Adapter de axios que responde con un error HTTP sin salir a la red
const responderError = (status, data = {}) => (config) =>
    Promise.reject(
        new AxiosError('error', 'ERR_BAD_REQUEST', config, null, { status, data, headers: {}, config, statusText: '' })
    );

describe('apiQuery + alertas', () => {
    beforeEach(() => {
        alertas._reiniciar();
        vi.spyOn(alertas, 'error');
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('alerta el mensaje del back en un 404', async () => {
        const adapter = responderError(404, { message: 'Proyecto inexistente' });
        await expect(apiQuery.get('/proyectos/x', { adapter })).rejects.toMatchObject({ status: 404 });
        expect(alertas.error).toHaveBeenCalledTimes(1);
        expect(alertas.error).toHaveBeenCalledWith('Proyecto inexistente');
    });

    it('alerta el mensaje genérico en un 500', async () => {
        const adapter = responderError(500, { message: 'stack interno' });
        await expect(apiQuery.post('/proyectos', {}, { adapter })).rejects.toMatchObject({ status: 500 });
        expect(alertas.error).toHaveBeenCalledWith('Ocurrió un error en el servidor. Intentá de nuevo más tarde.');
    });

    it('no alerta con alertarError false', async () => {
        const adapter = responderError(400, { message: 'Datos inválidos' });
        await expect(apiQuery.post('/proyectos', {}, { adapter, alertarError: false })).rejects.toMatchObject({ status: 400 });
        expect(alertas.error).not.toHaveBeenCalled();
    });

    it('no alerta si se canceló', async () => {
        const adapter = () => Promise.reject(new axios.CanceledError());
        await expect(apiQuery.get('/proyectos', { adapter })).rejects.toMatchObject({ cancelado: true });
        expect(alertas.error).not.toHaveBeenCalled();
    });

    it('401 con refresh fallido alerta una sola vez', async () => {
        vi.spyOn(refreshSession, 'refreshSession').mockRejectedValue(new Error('refresh falló'));
        const adapter = responderError(401, {});
        await expect(apiQuery.get('/proyectos', { adapter })).rejects.toMatchObject({ status: 401 });
        expect(alertas.error).toHaveBeenCalledTimes(1);
        expect(alertas.error).toHaveBeenCalledWith('Tenés que iniciar sesión para continuar.');
    });

    it('no alerta si la request sale bien', async () => {
        const adapter = (config) => Promise.resolve({ status: 200, data: { ok: 1 }, headers: {}, config, statusText: 'OK' });
        await expect(apiQuery.get('/proyectos', { adapter })).resolves.toEqual({ ok: 1 });
        expect(alertas.error).not.toHaveBeenCalled();
    });
});
