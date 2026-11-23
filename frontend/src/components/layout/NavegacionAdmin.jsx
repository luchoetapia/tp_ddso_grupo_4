import EnlacesNav from "./EnlacesNav";
import MenuUsuario from "./MenuUsuario";

const enlaces = [
    { href: "/admin/auditoria", texto: "Auditoría" },
    { href: "/proyectos", texto: "Proyectos" },
];

export default function NavegacionAdmin({ usuario, rutaActual, onCerrarSesion }) {
    return (
        <ul className="nav-enlaces flex-wrap justify-end">
            <EnlacesNav enlaces={enlaces} rutaActual={rutaActual} />
            <li>
                <MenuUsuario nombre={usuario.username} onCerrarSesion={onCerrarSesion} />
            </li>
        </ul>
    );
}
