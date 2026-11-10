const LOCALE = "es-AR";
const VACIO = "-";

const esNumeroValido = (valor) =>
    valor !== null && valor !== "" && valor !== undefined && Number.isFinite(Number(valor));

// "2026-11-10" se interpreta como fecha local (new Date lo tomaría como UTC y corre un día)
function aFecha(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        const [anio, mes, dia] = valor.split("-").map(Number);
        return new Date(anio, mes - 1, dia);
    }
    const fecha = valor instanceof Date ? valor : new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

// 1234567.8 -> "1.234.568"
export function formatearEntero(valor) {
    if (!esNumeroValido(valor)) return VACIO;
    return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(Number(valor));
}

// 1234567.891 -> "1.234.567,89" (decimales configurables)
export function formatearNumero(valor, decimales = 2) {
    if (!esNumeroValido(valor)) return VACIO;
    return new Intl.NumberFormat(LOCALE, {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
    }).format(Number(valor));
}

// 1234.5 -> "$ 1.234,50" (pesos por defecto; moneda: "USD", "EUR", etc.)
export function formatearMoneda(valor, moneda = "ARS") {
    if (!esNumeroValido(valor)) return VACIO;
    return new Intl.NumberFormat(LOCALE, { style: "currency", currency: moneda }).format(
        Number(valor),
    );
}

// "2026-11-10" o ISO -> "10/11/2026"
export function formatearFecha(valor) {
    const fecha = aFecha(valor);
    if (!fecha) return VACIO;
    return new Intl.DateTimeFormat(LOCALE, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(fecha);
}

// ISO -> "10/11/2026 00:02" (24 hs, en la zona horaria del navegador)
export function formatearFechaHora(valor) {
    const fecha = aFecha(valor);
    if (!fecha) return VACIO;
    return new Intl.DateTimeFormat(LOCALE, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    })
        .format(fecha)
        .replace(", ", " ");
}
