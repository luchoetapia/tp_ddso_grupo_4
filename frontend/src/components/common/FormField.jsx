import { useId } from "react";

// Estilo compartido por Input, Select y Textarea
export const controlClass =
    "rounded-[10px] border border-border bg-bg p-2.5 text-text aria-[invalid=true]:border-error";

// Envuelve un control con su label y el error inline accesible.
// `children` es una función que recibe las props de accesibilidad del control.
export default function FormField({ label, error, className, children }) {
    const id = useId();
    const errorId = `${id}-error`;
    const control = children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
    });

    return (
        <div className={`flex flex-col gap-[3px] ${className ?? ""}`}>
            <label htmlFor={id} className="text-[13px] text-muted">
                {label}
            </label>
            {control}
            {error && (
                <p id={errorId} role="alert" className="text-[13px] text-error">
                    {error}
                </p>
            )}
        </div>
    );
}
