import { Suspense } from "react";
import DatosPersonales from "@/views/colaboradoras/DatosPersonales";

// Suspense: la vista lee ?linkedin / ?errorLinkedin (vuelta de conectar LinkedIn) con useSearchParams
export default function DatosPersonalesPage() {
    return (
        <Suspense>
            <DatosPersonales />
        </Suspense>
    );
}
