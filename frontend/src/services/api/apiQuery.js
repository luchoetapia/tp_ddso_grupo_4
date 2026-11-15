import axios from 'axios';
import timeout from './timeout';
import refreshSession from './refreshSession';
import manejoErrores from './manejoErrores';
import alertas from '../alertas';

// Todas las rutas son relativas a /api (Next las reescribe al back).
// withCredentials: las cookies httpOnly de sesión viajan en cada request.
const cliente = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

const debeRenovarSesion = (err, url) =>
    axios.isAxiosError(err) &&
    err.response?.status === 401 &&
    refreshSession.refreshPermitido(url);

const request = async ({ mensajeError, ...config }, reintentado = false) => {
    try {
        const { data } = await cliente.request(timeout.configurar(config));
        return data;
    } catch (err) {
        if (!reintentado && debeRenovarSesion(err, config.url)) {
            try {
                await refreshSession.refreshSession();
            } catch {
                // El refresh falló (refreshSession ya redirige al login si corresponde):
                // se informa el 401 original, no el error del refresh
                return manejoErrores.manejar(err, mensajeError);
            }
            return request({ mensajeError, ...config }, true);
        }
        return manejoErrores.manejar(err, mensajeError);
    }
};

// Muestra el error al usuario una sola vez por llamada (aunque request se reintente por el refresh).
// No alerta si la request se canceló o si quien llama pasó { alertarError: false }.
const conAlerta = (promesa, alertarError) =>
    promesa.catch((error) => {
        if (alertarError && !error.cancelado) alertas.error(error.mensaje);
        throw error;
    });

const llamar = ({ alertarError = true, ...config }) => conAlerta(request(config), alertarError);

// Solo esto queda expuesto a las vistas
const apiQuery = {
    get: (url, opciones = {}) => llamar({ ...opciones, method: 'get', url }),
    post: (url, data, opciones = {}) => llamar({ ...opciones, method: 'post', url, data }),
    put: (url, data, opciones = {}) => llamar({ ...opciones, method: 'put', url, data }),
    patch: (url, data, opciones = {}) => llamar({ ...opciones, method: 'patch', url, data }),
    delete: (url, opciones = {}) => llamar({ ...opciones, method: 'delete', url }),
};

export default apiQuery;
