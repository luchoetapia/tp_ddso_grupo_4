"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import sesion, { roles } from "@/services/sesion";
import EnlacesNav from "./EnlacesNav";
import NavegacionColaborador from "./NavegacionColaborador";

const enlacesPublicos = [
    { href: "/", texto: "Inicio" },
    { href: "/proyectos", texto: "Proyectos" },
    { href: "/colaboradoras", texto: "Colaboradoras" },
];

export default function Navegacion() {
    const rutaActual = usePathname();
    const router = useRouter();
    const [usuario, setUsuario] = useState(undefined);

    // Se vuelve a consultar al navegar: así el navbar se entera del login/registro sin recargar la página
    useEffect(() => {
        let vigente = true;
        sesion.obtenerUsuario().then((u) => {
            if (vigente) setUsuario(u);
        });
        return () => {
            vigente = false;
        };
    }, [rutaActual]);

    // Si el logout falla, apiQuery ya muestra la alerta y la sesión queda como estaba
    const cerrarSesion = async () => {
        try {
            await sesion.cerrarSesion();
        } catch {
            return;
        }
        setUsuario(null);
        router.push("/");
    };

    return (
        <header className="nav-barra">
            <nav className="nav">
                <Link href="/" className="nav-marca">
                    <span className="nav-logo" aria-hidden="true">&lt;&gt;</span>
                    Código a Voluntad
                </Link>
                {usuario?.rol === roles.COLABORADOR ? (
                    <NavegacionColaborador
                        usuario={usuario}
                        rutaActual={rutaActual}
                        onCerrarSesion={cerrarSesion}
                    />
                ) : (
                    <ul className="nav-enlaces">
                        <EnlacesNav enlaces={enlacesPublicos} rutaActual={rutaActual} />
                        {usuario === null && (
                            <li>
                                <Link href="/ingresar" className="nav-enlace nav-cta">
                                    Ingresar
                                </Link>
                            </li>
                        )}
                    </ul>
                )}
            </nav>
        </header>
    );
}
