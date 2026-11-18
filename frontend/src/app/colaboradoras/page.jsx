import { Suspense } from "react";
import BuscarColaboradoras from "@/views/colaboradoras/buscarColaboradoras";

export default function ColaboradorasPage() {
    return (
        <Suspense>
            <BuscarColaboradoras />
        </Suspense>
    );
}
