import { Suspense } from "react";
import MisPostulaciones from "@/views/colaboradoras/misPostulaciones";

export default function misPostulacionesPage() {
    return (
        <Suspense>
            <MisPostulaciones />
        </Suspense>
    )
}