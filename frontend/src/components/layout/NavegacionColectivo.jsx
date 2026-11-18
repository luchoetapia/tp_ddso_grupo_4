import Link from "next/link";
import EnlacesNav from "./EnlacesNav";
import MenuUsuario from "./MenuUsuario";
import { IconoCampana } from "./iconos";

const enlaces = [
    { href: "/colectivo/inicio", texto: "Inicio" },
    { href: "/colectivo/misProyectos", texto: "Mis proyectos" },
    { href: "/colaboradoras", texto: "Buscar colaboradores" },
    { href: "/colectivo/perfil", texto: "Mi organización" },
];

export default function NavegacionColectivo({ usuario, rutaActual, onCerrarSesion }) {
    const enMensajes = rutaActual === "/mensajes";

    return (
        <ul className="nav-enlaces flex-wrap justify-end">
            <EnlacesNav enlaces={enlaces} rutaActual={rutaActual} />

            <li>
                <MenuUsuario nombre={usuario.username} onCerrarSesion={onCerrarSesion} />
            </li>
        </ul>
    );
}