import Link from "next/link";
import EnlacesNav from "./EnlacesNav";
import MenuUsuario from "./MenuUsuario";
import { IconoActividad, IconoCampana, IconoEquipo, IconoOrganizacion } from "./iconos";

const enlaces = [
    { href: "/colectivo/inicio", texto: "Inicio" },
    { href: "/colectivo/misProyectos", texto: "Mis proyectos" },
    { href: "/colaboradoras", texto: "Buscar colaboradores" },
];

const enlacesCuenta = [
    { href: "/colectivo/perfil", texto: "Mi organización", Icono: IconoOrganizacion },
    { href: "/colectivo/equipo", texto: "Equipo", Icono: IconoEquipo },
    { href: "/colectivo/actividad", texto: "Actividad", Icono: IconoActividad },
];

export default function NavegacionColectivo({ usuario, rutaActual, onCerrarSesion }) {
    const enMensajes = rutaActual === "/mensajes";

    return (
        <ul className="nav-enlaces flex-wrap justify-end">
            <EnlacesNav enlaces={enlaces} rutaActual={rutaActual} />
            <li>
                <Link
                    href="/mensajes"
                    aria-label="Notificaciones"
                    aria-current={enMensajes ? "page" : undefined}
                    className={`mx-1 inline-grid h-10 w-10 place-items-center rounded-full hover:bg-card ${
                        enMensajes ? "text-accent" : "text-text"
                    }`}
                >
                    <IconoCampana />
                </Link>
            </li>
            <li>
                <MenuUsuario nombre={usuario.username} onCerrarSesion={onCerrarSesion} enlaces={enlacesCuenta} />
            </li>
        </ul>
    );
}
