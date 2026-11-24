import { Suspense } from "react";
import EditarColectivo from "@/views/colectivos/EditarColectivo";

// Suspense: EditarColectivo lee los params de vuelta de LinkedIn (useSearchParams)
export default function EditarColectivoPage() {
    return (
        <Suspense>
            <EditarColectivo />
        </Suspense>
    );
}
