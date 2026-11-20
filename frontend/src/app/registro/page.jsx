import { Suspense } from "react";
import { Registro } from "@/views/sesion/Registro";

// Suspense: el registro lee ?origen=linkedin con useSearchParams
export default function RegistroPage() {
    return (
        <Suspense>
            <Registro />
        </Suspense>
    )
}
