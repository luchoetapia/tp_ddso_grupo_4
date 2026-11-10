export default function Card({ as: Tag = "div", className, children, ...props }) {
    return (
        <Tag
            className={`flex flex-col gap-2 rounded-[14px] border border-border bg-card p-[18px] shadow-[0_1px_2px_rgba(22,48,43,0.06)] ${className ?? ""}`}
            {...props}
        >
            {children}
        </Tag>
    );
}
