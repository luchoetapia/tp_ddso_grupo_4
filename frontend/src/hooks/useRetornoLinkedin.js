'use client'

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import alertas from "@/services/alertas";

const PARAMS_LINKEDIN = ["linkedin", "errorLinkedin", "publicar"];

// Al volver de conectar LinkedIn, la API redirige a la pantalla de origen con
// ?linkedin=vinculado&publicar=<idProyecto> o con ?errorLinkedin=<mensaje>.
// Este hook muestra el aviso, limpia esos params de la URL y devuelve el proyecto
// cuyo modal de publicación hay que reabrir (o null).
// Usa useSearchParams: la página tiene que estar dentro de un <Suspense>.
export default function useRetornoLinkedin() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const procesado = useRef(false);
    // Se lee una sola vez al montar: después el efecto limpia los params de la URL
    const [proyectoAPublicar, setProyectoAPublicar] = useState(() =>
        searchParams.get("linkedin") === "vinculado" ? searchParams.get("publicar") : null
    );

    useEffect(() => {
        const vinculado = searchParams.get("linkedin") === "vinculado";
        const error = searchParams.get("errorLinkedin");
        if (procesado.current || (!vinculado && !error)) return;
        procesado.current = true;

        if (error) alertas.error(error);
        else alertas.exito("Conectaste tu cuenta de LinkedIn");

        const params = new URLSearchParams(searchParams);
        PARAMS_LINKEDIN.forEach((p) => params.delete(p));
        router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
    }, [searchParams, router, pathname]);

    return { proyectoAPublicar, limpiar: () => setProyectoAPublicar(null) };
}
