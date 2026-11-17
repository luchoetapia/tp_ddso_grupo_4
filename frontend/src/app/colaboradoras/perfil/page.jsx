import { Suspense } from "react";
import PerfilColaboradora from "@/views/colaboradoras/PerfilColaboradora";

// useSearchParams necesita un Suspense para que Next pueda prerenderizar la página
export default function PerfilColaboradoraPage() {
    return (
        <Suspense>
            <PerfilColaboradora />
        </Suspense>
    );
}
