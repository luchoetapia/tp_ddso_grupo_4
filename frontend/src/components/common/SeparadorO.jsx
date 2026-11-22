// Línea con una "o" en el medio, para separar dos formas de hacer lo mismo (ej.: contraseña / LinkedIn)
export default function SeparadorO() {
    return (
        <div className="flex items-center gap-3 text-[13px] text-muted" role="separator" aria-label="o">
            <span className="h-px flex-1 bg-border" />
            <span aria-hidden="true">o</span>
            <span className="h-px flex-1 bg-border" />
        </div>
    );
}
