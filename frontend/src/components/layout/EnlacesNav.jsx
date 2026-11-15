import Link from "next/link";

export default function EnlacesNav({ enlaces, rutaActual }) {
    return enlaces.map(({ href, texto }) => (
        <li key={href}>
            <Link
                href={href}
                className={rutaActual === href ? "nav-enlace activo" : "nav-enlace"}
            >
                {texto}
            </Link>
        </li>
    ));
}
