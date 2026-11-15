"use client";

import { useEffect, useRef, useState } from "react";
import { TEMAS, aplicarTema, leerTema } from "@/services/tema";
import { Button } from "@/components/common";
import { IconoFlecha, IconoUsuario } from "./iconos";

export default function MenuUsuario({ nombre, onCerrarSesion }) {
    const [abierto, setAbierto] = useState(false);
    const [tema, setTema] = useState(leerTema);
    const [cerrando, setCerrando] = useState(false);
    const contenedor = useRef(null);

    // Se cierra al hacer click afuera o con Escape
    useEffect(() => {
        if (!abierto) return;

        const alClickear = (e) => {
            if (!contenedor.current?.contains(e.target)) setAbierto(false);
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

    const elegirTema = (valor) => {
        aplicarTema(valor);
        setTema(valor);
    };

    const cerrarSesion = async () => {
        setCerrando(true);
        try {
            await onCerrarSesion();
        } finally {
            setCerrando(false);
        }
    };

    return (
        <div ref={contenedor} className="relative">
            <button
                type="button"
                onClick={() => setAbierto((a) => !a)}
                aria-haspopup="true"
                aria-expanded={abierto}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 font-semibold text-text"
            >
                <span className="inline-grid h-8 w-8 place-items-center rounded-full bg-accent text-on-accent">
                    <IconoUsuario />
                </span>
                <span className="max-w-[140px] truncate">{nombre}</span>
                <span className={`text-muted transition-transform ${abierto ? "rotate-180" : ""}`}>
                    <IconoFlecha />
                </span>
            </button>

            {abierto && (
                <div className="absolute right-0 top-full z-20 mt-2 flex w-72 flex-col gap-3 rounded-[14px] border border-border bg-card p-3 shadow-[0_10px_26px_rgba(22,48,43,0.12)]">
                    <div className="flex flex-col gap-1.5">
                        <span id="titulo-tema" className="text-[13px] text-muted">Tema</span>
                        <div role="radiogroup" aria-labelledby="titulo-tema" className="grid grid-cols-3 gap-1 rounded-full bg-sf p-1">
                            {TEMAS.map(({ valor, texto }) => (
                                <button
                                    key={valor}
                                    type="button"
                                    role="radio"
                                    aria-checked={tema === valor}
                                    onClick={() => elegirTema(valor)}
                                    className={`cursor-pointer rounded-full px-2 py-1.5 text-[13px] font-semibold ${
                                        tema === valor ? "bg-card text-accent shadow-[0_1px_2px_rgba(22,48,43,0.12)]" : "text-muted"
                                    }`}
                                >
                                    {texto}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button variant="danger" onClick={cerrarSesion} cargando={cerrando} className="w-full">
                        Cerrar sesión
                    </Button>
                </div>
            )}
        </div>
    );
}
