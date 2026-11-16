"use client";

import { useEffect, useRef, useState } from "react";

// Estado de un menú desplegable que se cierra al hacer click afuera o con Escape.
export default function useDesplegable() {
    const [abierto, setAbierto] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!abierto) return;

        const alClickear = (e) => {
            if (!ref.current?.contains(e.target)) setAbierto(false);
        };
        const alTeclear = (e) => {
            if (e.key === "Escape") setAbierto(false);
        };

        document.addEventListener("mousedown", alClickear);
        document.addEventListener("keydown", alTeclear);
        return () => {
            document.removeEventListener("mousedown", alClickear);
            document.removeEventListener("keydown", alTeclear);
        };
    }, [abierto]);

    return { abierto, setAbierto, ref };
}
