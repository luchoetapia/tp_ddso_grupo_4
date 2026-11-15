const variantes = {
    accent: "bg-accent/15 text-accent",
    highlight: "bg-highlight text-[#16302b]",
    neutral: "bg-sf text-muted",
};

export default function Tag({ variant = "accent", className, children, ...props }) {
    return (
        <span
            className={`rounded-xl px-2 py-0.5 text-xs font-semibold ${variantes[variant]} ${className ?? ""}`}
            {...props}
        >
            {children}
        </span>
    );
}
