import Link from "next/link";
import EnlacesNav from "./EnlacesNav";
import MenuUsuario from "./MenuUsuario";
import { IconoCampana } from "./iconos";

const enlaces = [
    { href: "/colectivo/inicio", texto: "Inicio" },
    { href: "/proyectos", texto: "Proyectos" },
    { href: "/colectivos/proyectos", texto: "Mis proyectos" },
    { href: "/colaboradoras", texto: "Buscar colaboradoras" },
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
            <EnlacesNav
                enlaces={[{ href: "/colectivos/cuenta", texto: "Mi cuenta" }]}
                rutaActual={rutaActual}
            />
            <li>
                <MenuUsuario nombre={usuario.username} onCerrarSesion={onCerrarSesion} />
            </li>
        </ul>
    );
}