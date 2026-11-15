export default function Tag({ className, children, ...props }) {
    return (
        <span
            className={`rounded-xl bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent ${className ?? ""}`}
            {...props}
        >
            {children}
        </span>
    );
}
