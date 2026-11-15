const base =
    "inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-[18px] py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50";

const variantes = {
    secondary: "border-border bg-card text-text",
    primary: "border-accent bg-accent text-on-accent",
    danger: "border-error bg-card text-error",
    highlight: "border-highlight bg-highlight text-[#16302b]",
    link: "border-0 bg-transparent px-3 text-text",
};

const Spinner = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 animate-spin motion-reduce:animate-none">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

// `cargando`: deshabilita el botón y muestra un spinner (p. ej. mientras se envía un formulario)
export default function Button({
    variant = "secondary",
    type = "button",
    cargando = false,
    disabled,
    className,
    children,
    ...props
}) {
    return (
        <button
            type={type}
            disabled={disabled || cargando}
            aria-busy={cargando || undefined}
            className={`${base} ${variantes[variant]} ${className ?? ""}`}
            {...props}
        >
            {cargando && <Spinner />}
            {children}
        </button>
    );
}
