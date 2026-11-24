import sesion from './sesion';

// Código que manda la API (en details) cuando hay que conectar o reconectar LinkedIn para publicar
export const CODIGO_NO_VINCULADO = 'LINKEDIN_NO_VINCULADO';

// LinkedIn no deja publicar dos veces el mismo texto (409; en details viene el link al post existente)
export const CODIGO_DUPLICADO = 'LINKEDIN_DUPLICADO';

export const MAX_CARACTERES_POST = 3000;

const URL_VINCULAR = '/api/auth/linkedin/vincular';
// clave: id del proyecto o del logro que se está compartiendo
const CLAVE_BORRADOR = (clave) => `borradorLinkedin:${clave}`;

// El error (normalizado por apiQuery) indica que el usuario tiene que conectar LinkedIn
export const esNoVinculado = (error) =>
    error?.status === 403 && error.detalles?.some((d) => d?.codigo === CODIGO_NO_VINCULADO);

// Link al post que ya existe si el error es por texto repetido, o null
export const urlSiEsDuplicado = (error) =>
    error?.status === 409 ? error.detalles?.find((d) => d?.codigo === CODIGO_DUPLICADO)?.url ?? null : null;

export const textoSugerido = ({ titulo, perfil, idProyecto }) => {
    const origen = typeof window === 'undefined' ? '' : window.location.origin;
    const url = `${origen}/proyectos/ver?id=${idProyecto}`;
    const rol = perfil ? ` como ${perfil}` : '';

    return `¡Estoy colaborando en "${titulo}"${rol} a través de Código a Voluntad! 🙌\n\n`
        + `Si te interesa el proyecto o querés sumarte, lo podés ver acá:\n${url}`;
};

// Texto inicial para que un colectivo comparta un logro de su proyecto
export const textoSugeridoLogro = ({ proyecto, logro, organizacion }) => {
    const origen = typeof window === 'undefined' ? '' : window.location.origin;
    const url = `${origen}/proyectos/ver?id=${proyecto.id}`;
    const quien = organizacion ? `En ${organizacion} alcanzamos` : 'Alcanzamos';

    return `🎉 ${quien} un nuevo logro en "${proyecto.titulo}": ${logro.titulo}\n\n`
        + `${logro.descripcion}\n\n`
        + `El proyecto avanza gracias a personas voluntarias que se suman a través de Código a Voluntad. `
        + `Si querés conocerlo o sumarte, miralo acá:\n${url}`;
};

// Borrador en sessionStorage: sobrevive al ir y volver de LinkedIn para conectar la cuenta.
// sessionStorage puede no estar disponible (modo privado, etc.): en ese caso simplemente no se guarda.
export const borrador = {
    leer: (clave) => {
        try {
            return sessionStorage.getItem(CLAVE_BORRADOR(clave));
        } catch {
            return null;
        }
    },
    guardar: (clave, texto) => {
        try {
            sessionStorage.setItem(CLAVE_BORRADOR(clave), texto);
        } catch {
            // sin borrador
        }
    },
    borrar: (clave) => {
        try {
            sessionStorage.removeItem(CLAVE_BORRADOR(clave));
        } catch {
            // nada que borrar
        }
    },
};

// Lleva al usuario a LinkedIn para conectar su cuenta. Es una navegación completa (no pasa por apiQuery),
// así que antes se renueva la sesión por si el access token venció.
// Al terminar, la API vuelve a esta misma pantalla con ?linkedin=vinculado (y publicar=<id del proyecto o logro> si vino).
export const conectarLinkedin = async ({ publicar } = {}) => {
    await sesion.obtenerUsuario();

    const params = new URLSearchParams({ volverA: window.location.pathname + window.location.search });
    if (publicar) params.set('publicar', publicar);

    // Es una ruta de la API (no una página de Next): tiene que ser una navegación completa del navegador
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${URL_VINCULAR}?${params}`);
};
