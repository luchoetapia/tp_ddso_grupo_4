// Presentacional. El auto-cierre y la posición los maneja <ContenedorAlertas /> junto al servicio de alertas.
const ESTILOS = {
    info: "bg-text text-bg",
    error: "bg-error text-on-accent",
    aviso: "bg-highlight text-text",
    exito: "bg-accent text-on-accent",
};

const ALIAS = { ok: "exito" };

export default function Toast({ type = "info", onClose, children }) {
    const tipo = ALIAS[type] ?? (ESTILOS[type] ? type : "info");
    const urgente = tipo === "error" || tipo === "aviso";

    return (
        <div
            role={urgente ? "alert" : "status"}
            className={`items-start gap-3 rounded-lg px-4 py-2.5 shadow-[0_10px_26px_rgba(22,48,43,0.12)] ${
                onClose ? "flex w-full" : "inline-flex"
            } ${ESTILOS[tipo]}`}
        >
            <span className="flex-1 break-words">{children}</span>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar alerta"
                    className="-my-0.5 -mr-1 cursor-pointer rounded px-1 text-lg leading-none opacity-80 hover:opacity-100"
                >
                    ×
                </button>
            )}
        </div>
    );
}
