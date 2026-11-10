// Presentacional. El auto-cierre a los 3s y la posición se manejan en el provider de toasts.
export default function Toast({ type = "ok", children }) {
    const esError = type === "error";
    return (
        <div
            role={esError ? "alert" : "status"}
            className={`inline-block rounded-lg px-4 py-2.5 ${
                esError ? "bg-error text-on-accent" : "bg-text text-bg"
            }`}
        >
            {children}
        </div>
    );
}
