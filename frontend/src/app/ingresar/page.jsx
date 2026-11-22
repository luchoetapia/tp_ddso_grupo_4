import { Suspense } from "react";
import Ingreso from "@/views/sesion/Ingreso";

// Suspense: el formulario de ingreso lee ?errorLinkedin con useSearchParams
export default function IngresoPage() {
    return (
        <Suspense>
            <Ingreso />
        </Suspense>
    );
}
