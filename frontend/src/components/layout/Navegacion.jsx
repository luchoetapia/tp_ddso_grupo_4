"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";

const INICIO_COLABORADORA = "/colaboradoras/inicio";

const ENLACES = {
    publico: [
        { href: "/", texto: "Inicio" },
        { href: "/proyectos", texto: "Proyectos" },
    ],
    colectivo: [
        { href: "/", texto: "Inicio" },
        { href: "/proyectos", texto: "Proyectos" },
        { href: "/mis-proyectos", texto: "Mis proyectos" },
        { href: "/colaboradoras", texto: "Buscar colaboradoras" },
        { href: "/mensajes", texto: "Mensajes" },
        { href: "/mi-cuenta", texto: "Mi cuenta" },
    ],
    colaborador: [
        { href: INICIO_COLABORADORA, texto: "Inicio" },
        { href: "/proyectos", texto: "Proyectos" },
        { href: "/mis-oportunidades", texto: "Mis oportunidades" },
        { href: "/mensajes", texto: "Mensajes", contador: true },
        { href: "/mi-cuenta", texto: "Mi cuenta" },
    ],
    admin: [
        { href: "/", texto: "Inicio" },
        { href: "/proyectos", texto: "Proyectos" },
        { href: "/mensajes", texto: "Mensajes" },
        { href: "/admin", texto: "Admin" },
    ],
};

const pedirUsuario = async () => {
    try {
        const { data } = await axios.get("/api/auth/me");
        return data.usuario;
    } catch (e) {
        if (e.response?.status !== 401) return null;
        try {
            await axios.post("/api/auth/refresh");
            const { data } = await axios.get("/api/auth/me");
            return data.usuario;
        } catch {
            return null;
        }
    }
};

export default function Navegacion() {
    const rutaActual = usePathname();
    const router = useRouter();
    const [usuario, setUsuario] = useState(undefined);
    const [cantidadMensajes, setCantidadMensajes] = useState(0);

    useEffect(() => {
        let vigente = true;
        pedirUsuario().then((u) => {
            if (vigente) setUsuario(u);
        });
        return () => {
            vigente = false;
        };
    }, [rutaActual]);

    const rol = usuario?.rol;

    // Solo las colaboradoras tienen contador de mensajes
    useEffect(() => {
        if (rol !== "colaborador") {
            setCantidadMensajes(0);
            return;
        }
        let vigente = true;
        axios
            .get("/api/colaboradores/me/notificaciones")
            .then(({ data }) => vigente && setCantidadMensajes(data.length))
            .catch(() => vigente && setCantidadMensajes(0));
        return () => {
            vigente = false;
        };
    }, [rol, rutaActual]);

    const enlaces = ENLACES[rol] ?? ENLACES.publico;

    const cerrarSesion = async () => {
        try {
            await axios.post("/api/auth/logout");
        } finally {
            setUsuario(null);
            router.push("/ingresar");
        }
    };

    return (
        <header className="nav-barra">
            <nav className="nav">
                <Link href={rol === "colaborador" ? INICIO_COLABORADORA : "/"} className="nav-marca">
                    <span className="nav-logo" aria-hidden="true">&lt;&gt;</span>
                    Código a Voluntad
                </Link>
                <ul className="nav-enlaces flex-wrap justify-end">
                    {usuario !== undefined && enlaces.map(({ href, texto, contador }) => (
                        <li key={href}>
                            <Link
                                href={href}
                                className={rutaActual === href ? "nav-enlace activo" : "nav-enlace"}
                            >
                                {texto}{contador && cantidadMensajes > 0 ? ` (${cantidadMensajes})` : ""}
                            </Link>
                        </li>
                    ))}
                    {usuario === null && (
                        <li>
                            <Link href="/ingresar" className="nav-enlace nav-cta">
                                Ingresar
                            </Link>
                        </li>
                    )}
                    {usuario && (
                        <li>
                            <button type="button" onClick={cerrarSesion} className="nav-enlace nav-salir">
                                Salir
                            </button>
                        </li>
                    )}
                </ul>
            </nav>
        </header>
    );
}