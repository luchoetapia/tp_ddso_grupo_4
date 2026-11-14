import axios from 'axios';
import timeout from './timeout';

// Mensajes para mostrar al usuario cuando el back no manda uno útil
const MENSAJES_POR_STATUS = {
    0: 'No se pudo conectar con el servidor. Revisá tu conexión.',
    400: 'Hay datos inválidos en la solicitud.',
    401: 'Tenés que iniciar sesión para continuar.',
    403: 'No tenés permiso para realizar esta acción.',
    404: 'No se encontró lo que buscabas.',
    409: 'La operación entra en conflicto con datos existentes.',
    500: 'Ocurrió un error en el servidor. Intentá de nuevo más tarde.',
    504: 'El servidor tardó demasiado en responder. Intentá de nuevo más tarde.',
};

const MENSAJE_GENERICO = 'Ocurrió un error inesperado.';

class ManejoErrores {
    normalizar = (err, porDefecto) => {
        const base = { status: null, mensaje: porDefecto ?? MENSAJE_GENERICO, detalles: [], errores: {}, cancelado: false, original: err };

        if (axios.isCancel(err)) return { ...base, cancelado: true };

        // Error de código propio (no viene de axios)
        if (!axios.isAxiosError(err)) return base;

        if (timeout.esTimeout(err)) {
            return { ...base, status: 504, mensaje: MENSAJES_POR_STATUS[504] };
        }

        // Sin respuesta: red caída, CORS, server apagado
        if (!err.response) {
            return { ...base, status: 0, mensaje: MENSAJES_POR_STATUS[0] };
        }

        const { status, data } = err.response;
        const detalles = Array.isArray(data?.details) ? data.details : [];

        return {
            ...base,
            status,
            mensaje: this.mensajeSegunStatus(status, data?.message, porDefecto),
            detalles,
            errores: this.erroresPorCampo(detalles),
        };
    };

    // Para 4xx el back manda mensajes pensados para el usuario (AppError).
    // Para 5xx no se muestra el mensaje del back: puede filtrar detalles internos.
    mensajeSegunStatus = (status, mensajeBack, porDefecto) => {
        if (status >= 500) return MENSAJES_POR_STATUS[status] ?? MENSAJES_POR_STATUS[500];
        return mensajeBack || porDefecto || MENSAJES_POR_STATUS[status] || MENSAJE_GENERICO;
    };

    // Errores de validacion, cada campo guarda todos sus errores (sin repetir mensajes).
    erroresPorCampo = (detalles = []) => {
        const errores = {};

        for (const issue of detalles) {
            if (!Array.isArray(issue?.path) || !issue.path.length || !issue.message) continue;
            const campo = issue.path.join('.');
            errores[campo] ??= [];
            if (!errores[campo].includes(issue.message)) errores[campo].push(issue.message);
        }

        return errores;
    };

    // Atajo para el caso más común: solo el texto a mostrar
    mensaje = (err, porDefecto) => this.normalizar(err, porDefecto).mensaje;

    // Loguea en consola lo que no es culpa del usuario (5xx, red, timeout, errores de código)
    loguear = (error) => {
        if (error.cancelado) return;
        if (error.status !== null && error.status >= 400 && error.status < 500) return;

        const config = error.original?.config;
        console.error(`[${error.status ?? 'ERR'}] Error en consulta:`, {
            metodo: config?.method?.toUpperCase(),
            url: config?.url,
            mensaje: error.mensaje,
            original: error.original,
        });
    };

    // Para usar en el .catch de una consulta: normaliza, loguea y relanza el error normalizado
    manejar = (err, porDefecto) => {
        const error = this.normalizar(err, porDefecto);
        this.loguear(error);
        
        throw error;
    };
}

export default new ManejoErrores();
