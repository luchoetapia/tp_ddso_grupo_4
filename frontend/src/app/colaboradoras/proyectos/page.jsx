import { Suspense } from "react";
import BuscarProyecto from "@/views/proyectos/BuscarProyecto";

export default function ProyectosColaboradorPage() {
    return (
        <Suspense>
            <BuscarProyecto />
        </Suspense>
    );
}
