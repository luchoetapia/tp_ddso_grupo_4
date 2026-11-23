'use client'

import { useId, useState } from "react";
import Button from "./Button";

// URL de la API que arranca el ingreso con LinkedIn (pasa por el rewrite /api de Next)
export const URL_INGRESO_LINKEDIN = "/api/auth/linkedin";

// Logo oficial descargado del Brand Resources de LinkedIn (https://brand.linkedin.com/downloads),
// guardado en frontend/public. Si el archivo no está, el botón se muestra solo con el texto.
const RUTA_LOGO = "/linkedin-logo.png";

// Azul de marca de LinkedIn y su variante oscura para hover
const estiloBase =
    "inline-flex items-center justify-center rounded-full border border-[#0A66C2] bg-[#0A66C2] px-[18px] py-2 font-semibold text-white hover:border-[#004182] hover:bg-[#004182]";

// Normal: el botón grande del login/registro. Compacto: mismo alto y separación que <Button>,
// para ponerlo al lado de otros botones (ej: "Compartir en LinkedIn" en las cards)
const tamanos = {
    normal: { boton: "min-h-11 gap-2", logo: "h-5 w-5" },
    compacto: { boton: "min-h-10 gap-1.5", logo: "h-4 w-4" },
};

// Es un <a> común y no un fetch/Axios ni un <Link> de Next: el ingreso con LinkedIn es una navegación
// completa del navegador. La API redirige a LinkedIn y LinkedIn vuelve al front con la sesión iniciada.
// Solo para colaboradores (los colectivos no pueden ingresar con LinkedIn).
// motivoDeshabilitado: texto del tooltip que explica por qué el botón está deshabilitado
// href: a dónde navega (por defecto, el ingreso).
// onClick: si se pasa, se renderiza un <button> en lugar del link (abrir el modal de compartir,
// o conectar LinkedIn guardando antes un borrador y renovando la sesión)
// compacto: tamaño de los botones comunes (ver tamanos)
export default function BotonLinkedin({
    children = "Continuar con LinkedIn",
    deshabilitado = false,
    motivoDeshabilitado,
    className,
    href = URL_INGRESO_LINKEDIN,
    onClick,
    compacto = false,
}) {
    const [hayLogo, setHayLogo] = useState(true);
    const idTooltip = useId();
    const tamano = tamanos[compacto ? "compacto" : "normal"];
    const estilo = `${estiloBase} ${tamano.boton}`;

    const contenido = (
        <>
            {hayLogo && (
                // eslint-disable-next-line @next/next/no-img-element -- ícono chico y fijo, no necesita next/image
                <img src={RUTA_LOGO} alt="" aria-hidden="true" width={20} height={20} className={`${tamano.logo} shrink-0`} onError={() => setHayLogo(false)} />
            )}
            {children}
        </>
    );

    if (deshabilitado) {
        const boton = (
            <Button disabled className={`${compacto ? "" : "min-h-11 w-full"} border-[#0A66C2]! bg-[#0A66C2]! text-white! ${motivoDeshabilitado ? "pointer-events-none" : ""}`}>
                {contenido}
            </Button>
        );
        if (!motivoDeshabilitado) return <span className={`flex flex-col ${className ?? ""}`}>{boton}</span>;

        // Un botón disabled no recibe hover ni foco: el tooltip lo maneja el contenedor
        // (focuseable con teclado y asociado con aria-describedby para lectores de pantalla)
        return (
            <span tabIndex={0} aria-describedby={idTooltip} className={`group relative flex flex-col rounded-full ${className ?? ""}`}>
                {boton}
                <span
                    id={idTooltip}
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[300px] -translate-x-1/2 rounded-[8px] bg-text px-3 py-2 text-center text-[13px] text-bg opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus:opacity-100 motion-reduce:transition-none"
                >
                    {motivoDeshabilitado}
                </span>
            </span>
        );
    }

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={`cursor-pointer ${estilo} ${className ?? ""}`}>
                {contenido}
            </button>
        );
    }

    return (
        <a href={href} className={`${estilo} ${className ?? ""}`}>
            {contenido}
        </a>
    );
}
