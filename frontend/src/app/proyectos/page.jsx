import { Suspense } from "react";
import ListadoProyectos from "@/views/proyectos/ListadoProyectos";

export default function ProyectosPage() {
    return (
        <Suspense>
            <ListadoProyectos />
        </Suspense>
    );
}
