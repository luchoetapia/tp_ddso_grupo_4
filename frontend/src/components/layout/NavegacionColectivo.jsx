import EnlacesNav from "./EnlacesNav";
import MenuUsuario from "./MenuUsuario";
import { IconoActividad, IconoEquipo, IconoOrganizacion } from "./iconos";

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
    return (
        <ul className="nav-enlaces flex-wrap justify-end">
            <EnlacesNav enlaces={enlaces} rutaActual={rutaActual} />
            <li>
                <MenuUsuario nombre={usuario.username} onCerrarSesion={onCerrarSesion} enlaces={enlacesCuenta} />
            </li>
        </ul>
    );
}
