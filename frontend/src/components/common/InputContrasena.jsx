'use client'

import { useState } from "react";
import FormField, { controlClass } from "./FormField";

const ojoAbierto = "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z";
const ojoTachado = "M3 3l18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2";

// Input de contraseña con botón para mostrarla u ocultarla
export default function InputContrasena({ label, error, className, ...props }) {
    const [visible, setVisible] = useState(false);

    return (
        <FormField label={label} error={error} className={className}>
            {(a11y) => (
                <div className="relative">
                    <input
                        type={visible ? "text" : "password"}
                        className={`${controlClass} w-full pr-11`}
                        {...a11y}
                        {...props}
                    />
                    <button
                        type="button"
                        onClick={() => setVisible((anterior) => !anterior)}
                        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={visible}
                        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-[10px] text-muted hover:text-text"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                            <path d={visible ? ojoTachado : ojoAbierto} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            )}
        </FormField>
    );
}
