import axios from 'axios';

const TIMEOUT_MS = 30000;
const TIMEOUT_STATUS = 504;

class TimeoutHandler {
    TIMEOUT_MS = TIMEOUT_MS;

    configurar = (config = {}) => ({
        ...config,
        timeout: config.timeout ?? TIMEOUT_MS,
        timeoutErrorMessage: config.timeoutErrorMessage ?? `La solicitud superó los ${TIMEOUT_MS / 1000} segundos`,
        
        // distingue timeout de cancelación
        transitional: { ...config.transitional, clarifyTimeoutError: true },
    });

    // Timeout del lado del cliente (axios) o 504 devuelto por el servidor/proxy
    esTimeout = (err) => {
        if (!axios.isAxiosError(err)) return false;
        return err.code === 'ETIMEDOUT' || err.response?.status === TIMEOUT_STATUS;
    };

    // Para usar en el .catch de una request. El que llama decide como manejar el error
    manejar = (err) => {
        if (!this.esTimeout(err)) throw err;

        err.status = TIMEOUT_STATUS;
        console.error(`[${TIMEOUT_STATUS}] Timeout:`, {
            metodo: err.config?.method?.toUpperCase(),
            url: err.config?.url,
            mensaje: err.message,
        });
        throw err;
    };
}

export default new TimeoutHandler();
