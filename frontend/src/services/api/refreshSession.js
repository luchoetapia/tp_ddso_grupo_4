import axios from 'axios';

const LOGIN_PATH = '/ingresar';

class RefreshSession {
    // Endpoints cuyo 401 NO debe disparar un refresh
    NO_REFRESH_PATHS = [
        '/auth/login',    // 401 = credenciales inválidas, no sesión vencida
        '/auth/registro', // no hay sesión todavía
        '/auth/refresh',  // si el refresh falla, reintentarlo genera un loop infinito
        '/auth/logout',   // cerrando sesión: no tiene sentido renovarla
    ]

    constructor() {
        this.refreshPromise = null;
    }

    refreshPermitido = (path = '') => !this.NO_REFRESH_PATHS.includes(path.split('?')[0]);

    // Si varias requests reciben 401 a la vez, comparten un único refresh
    refreshSession = () => {
        if (!this.refreshPromise) {
            this.refreshPromise = axios.post('/api/auth/refresh', null, { withCredentials: true })
                .then(() => undefined)
                .catch((err) => {
                    if (axios.isAxiosError(err) && [401, 403].includes(err.response?.status ?? 0)) {
                        this.redirigirALogin();
                    }
                    throw err;
                })
                .finally(() => {
                    this.refreshPromise = null;
                });
        }
        return this.refreshPromise;
    }

    redirigirALogin = () => {
        if (typeof window === 'undefined') return;

        const { pathname, search } = window.location;
        if (pathname === LOGIN_PATH) return;

        // Guardo a dónde volver después de loguearse
        const volverA = encodeURIComponent(pathname + search);
        window.location.replace(`${LOGIN_PATH}?redirect=${volverA}`);
    }
}

export default new RefreshSession();
