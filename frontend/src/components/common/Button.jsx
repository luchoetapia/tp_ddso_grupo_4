const base =
    "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border px-[18px] py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50";

const variantes = {
    secondary: "border-border bg-card text-text",
    primary: "border-accent bg-accent text-on-accent",
    danger: "border-error bg-card text-error",
    highlight: "border-highlight bg-highlight text-[#16302b]",
    link: "border-0 bg-transparent px-3 text-text",
};

export default function Button({
    variant = "secondary",
    type = "button",
    className,
    children,
    ...props
}) {
    return (
        <button
            type={type}
            className={`${base} ${variantes[variant]} ${className ?? ""}`}
            {...props}
        >
            {children}
        </button>
    );
}
