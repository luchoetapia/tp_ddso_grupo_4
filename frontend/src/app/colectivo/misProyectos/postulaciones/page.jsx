import { Suspense } from "react";
import PostulacionesProyecto from "@/views/colectivos/PostulacionesProyecto";

// useSearchParams necesita un Suspense para que Next pueda prerenderizar la página
export default function PostulacionesProyectoPage() {
    return (
        <Suspense>
            <PostulacionesProyecto />
        </Suspense>
    );
}
