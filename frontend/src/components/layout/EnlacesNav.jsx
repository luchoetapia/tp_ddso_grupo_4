import Link from "next/link";

// contador (opcional): número a destacar junto al enlace (p. ej. pendientes); descripcionContador lo lee el lector de pantalla
export default function EnlacesNav({ enlaces, rutaActual }) {
    return enlaces.map(({ href, texto, contador, descripcionContador }) => (
        <li key={href}>
            <Link
                href={href}
                className={rutaActual === href ? "nav-enlace activo" : "nav-enlace"}
                aria-label={contador > 0 ? `${texto}: ${contador} ${descripcionContador ?? ""}`.trim() : undefined}
            >
                {texto}
                {contador > 0 && (
                    <span
                        aria-hidden="true"
                        className="ml-1.5 inline-grid min-w-5 place-items-center rounded-full bg-error px-1.5 text-[12px] font-bold leading-5 text-white"
                    >
                        {contador > 99 ? "99+" : contador}
                    </span>
                )}
            </Link>
        </li>
    ));
}
