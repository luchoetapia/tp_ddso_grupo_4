"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
    { href: "/", texto: "Inicio" },
    { href: "/proyectos", texto: "Proyectos" },
];

export default function Navegacion() {
    const rutaActual = usePathname();

    return (
        <header className="nav-barra">
            <nav className="nav">
                <Link href="/" className="nav-marca">
                    <span className="nav-logo" aria-hidden="true">&lt;&gt;</span>
                    Código a Voluntad
                </Link>
                <ul className="nav-enlaces">
                    {enlaces.map(({ href, texto }) => (
                        <li key={href}>
                            <Link
                                href={href}
                                className={rutaActual === href ? "nav-enlace activo" : "nav-enlace"}
                            >
                                {texto}
                            </Link>
                        </li>
                    ))}
                    <li>
                        <Link href="/ingresar" className="nav-enlace nav-cta">
                            Registrar
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
