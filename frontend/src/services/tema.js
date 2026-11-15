const CLAVE = 'tema';

export const TEMAS = [
    { valor: 'claro', texto: 'Claro' },
    { valor: 'oscuro', texto: 'Oscuro' },
    { valor: 'dispositivo', texto: 'Dispositivo' },
];

// "dispositivo" no se guarda: sin data-theme, el CSS sigue a prefers-color-scheme
export const leerTema = () => {
    try {
        return localStorage.getItem(CLAVE) ?? 'dispositivo';
    } catch {
        return 'dispositivo';
    }
};

export const aplicarTema = (tema) => {
    const raiz = document.documentElement;
    try {
        if (tema === 'dispositivo') {
            raiz.removeAttribute('data-theme');
            localStorage.removeItem(CLAVE);
        } else {
            raiz.dataset.theme = tema;
            localStorage.setItem(CLAVE, tema);
        }
    } catch {
        // Sin localStorage (modo privado estricto): el tema se aplica igual, pero no se recuerda
    }
};

// Se inyecta en el <head>: aplica el tema guardado antes del primer pintado (evita el parpadeo)
export const scriptTemaInicial =
    `try{var t=localStorage.getItem('${CLAVE}');if(t)document.documentElement.dataset.theme=t}catch(e){}`;
