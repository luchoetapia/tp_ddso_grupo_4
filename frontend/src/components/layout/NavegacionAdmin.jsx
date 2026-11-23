"use client";

import { useEffect, useState } from "react";
import apiQuery from "@/services/api/apiQuery";
import { EVENTO_MODERACION_ACTUALIZADA } from "@/helpers/moderacion";
import EnlacesNav from "./EnlacesNav";
import MenuUsuario from "./MenuUsuario";

// Cantidad de reportes pendientes de revisión: es el aviso que reciben los admins dentro de la app
const consultarPendientes = (signal) =>
    apiQuery
        .get("/reportes", { params: { estado: "Pendiente", limite: 1 }, signal, alertarError: false })
        .then(({ paginacion }) => paginacion.total);

export default function NavegacionAdmin({ usuario, rutaActual, onCerrarSesion }) {
    const [pendientes, setPendientes] = useState(0);

    // Se vuelve a consultar al navegar y cuando la pantalla de Moderación resuelve un reporte
    useEffect(() => {
        const controlador = new AbortController();
        const actualizar = () => consultarPendientes(controlador.signal).then(setPendientes).catch(() => {});

        actualizar();
        window.addEventListener(EVENTO_MODERACION_ACTUALIZADA, actualizar);
        return () => {
            controlador.abort();
            window.removeEventListener(EVENTO_MODERACION_ACTUALIZADA, actualizar);
        };
    }, [rutaActual]);

    const enlaces = [
        { href: "/admin/moderacion", texto: "Moderación", contador: pendientes, descripcionContador: "reportes pendientes" },
        { href: "/admin/auditoria", texto: "Auditoría" },
        { href: "/proyectos", texto: "Proyectos" },
    ];

    return (
        <ul className="nav-enlaces flex-wrap justify-end">
            <EnlacesNav enlaces={enlaces} rutaActual={rutaActual} />
            <li>
                <MenuUsuario nombre={usuario.username} onCerrarSesion={onCerrarSesion} />
            </li>
        </ul>
    );
}
