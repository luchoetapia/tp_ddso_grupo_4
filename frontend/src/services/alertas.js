// Servicio central de alertas: se puede llamar desde cualquier lado (vistas, servicios, apiQuery).
// Guarda las alertas activas y avisa a los suscriptores; <ContenedorAlertas /> es quien las dibuja.
export const DURACION_MS = 10000;
export const MAX_VISIBLES = 3;
export const TIPOS = ['info', 'error', 'aviso', 'exito'];

class Alertas {
    constructor() {
        this.lista = [];          // se reemplaza en cada cambio: obtener() devuelve una referencia estable
        this.timers = new Map();  // id -> timeout de auto-cierre
        this.suscriptores = new Set();
        this.ultimoId = 0;
    }

    info = (mensaje) => this.agregar('info', mensaje);
    error = (mensaje) => this.agregar('error', mensaje);
    aviso = (mensaje) => this.agregar('aviso', mensaje);
    exito = (mensaje) => this.agregar('exito', mensaje);

    cerrar = (id) => {
        this.cancelarTimer(id);
        if (!this.lista.some((alerta) => alerta.id === id)) return;
        this.actualizar(this.lista.filter((alerta) => alerta.id !== id));
    };

    // Firma pensada para useSyncExternalStore
    suscribir = (fn) => {
        this.suscriptores.add(fn);
        return () => this.suscriptores.delete(fn);
    };

    obtener = () => this.lista;

    agregar = (tipo, mensaje) => {
        if (typeof mensaje !== 'string' || !mensaje.trim()) return null;

        // Si ya está visible la misma alerta (ej.: varias requests fallan por red caída), solo se reinicia su tiempo
        const repetida = this.lista.find((alerta) => alerta.tipo === tipo && alerta.mensaje === mensaje);
        if (repetida) {
            this.programarCierre(repetida.id);
            return repetida.id;
        }

        const nueva = { id: ++this.ultimoId, tipo, mensaje };
        let lista = [...this.lista, nueva];

        // Se descartan las más viejas para no tapar la pantalla
        while (lista.length > MAX_VISIBLES) {
            this.cancelarTimer(lista[0].id);
            lista = lista.slice(1);
        }

        this.programarCierre(nueva.id);
        this.actualizar(lista);
        return nueva.id;
    };

    programarCierre = (id) => {
        this.cancelarTimer(id);
        this.timers.set(id, setTimeout(() => this.cerrar(id), DURACION_MS));
    };

    cancelarTimer = (id) => {
        clearTimeout(this.timers.get(id));
        this.timers.delete(id);
    };

    actualizar = (lista) => {
        this.lista = lista;
        this.suscriptores.forEach((fn) => fn());
    };

    // Solo para tests
    _reiniciar = () => {
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers.clear();
        this.lista = [];
        this.suscriptores.clear();
    };
}

const alertas = new Alertas();
export default alertas;
