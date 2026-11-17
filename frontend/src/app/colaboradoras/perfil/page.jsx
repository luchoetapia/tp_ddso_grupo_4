import { Suspense } from "react";
import PerfilColaboradora from "@/views/colaboradoras/PerfilColaboradora";

export default function PerfilColaboradoraPage() {
    return (
        <Suspense>
            <PerfilColaboradora />
        </Suspense>
    );
}
