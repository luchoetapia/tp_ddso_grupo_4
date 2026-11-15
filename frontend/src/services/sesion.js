import axios from 'axios';
import apiQuery from './api/apiQuery';

export const roles = {
    ADMIN: 'admin',
    COLABORADOR: 'colaborador',
    COLECTIVO: 'colectivo',
};

const opciones = { withCredentials: true };

// Devuelve el usuario logueado o null.
const obtenerUsuario = async () => {
    try {
        const { data } = await axios.get('/api/auth/me', opciones);
        return data.usuario;
    } catch (err) {
        if (err.response?.status !== 401) return null;
    }

    // Access token vencido: se intenta renovar con el refresh token
    try {
        const { data } = await axios.post('/api/auth/refresh', null, opciones);
        return data.usuario;
    } catch {
        return null;
    }
};

const cerrarSesion = () =>
    apiQuery.post('/auth/logout', null, { mensajeError: 'No se pudo cerrar la sesión.' });

const sesion = { obtenerUsuario, cerrarSesion };

export default sesion;
