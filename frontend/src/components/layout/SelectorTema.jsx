"use client";

import { TEMAS } from "@/services/tema";
import useDesplegable from "@/hooks/useDesplegable";
import useTema from "@/hooks/useTema";
import { IconoLuna, IconoMonitor, IconoSol } from "./iconos";

const iconos = {
    claro: IconoSol,
    oscuro: IconoLuna,
    dispositivo: IconoMonitor,
};

export default function SelectorTema() {
    const { abierto, setAbierto, ref } = useDesplegable();
    const [tema, elegirTema] = useTema();
    const IconoActual = iconos[tema];

    const elegir = (valor) => {
        elegirTema(valor);
        setAbierto(false);
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setAbierto((a) => !a)}
                aria-label="Cambiar tema"
                aria-haspopup="true"
                aria-expanded={abierto}
                className="inline-grid h-10 w-10 cursor-pointer place-items-center rounded-full text-text hover:bg-card"
            >
                <IconoActual />
            </button>

            {abierto && (
                <div
                    role="radiogroup"
                    aria-label="Tema"
                    className="absolute right-0 top-full z-20 mt-2 flex w-44 flex-col gap-1 rounded-[14px] border border-border bg-card p-1.5 shadow-[0_10px_26px_rgba(22,48,43,0.12)]"
                >
                    {TEMAS.map(({ valor, texto }) => {
                        const Icono = iconos[valor];
                        const activo = tema === valor;
                        return (
                            <button
                                key={valor}
                                type="button"
                                role="radio"
                                aria-checked={activo}
                                onClick={() => elegir(valor)}
                                className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2 text-left font-semibold hover:bg-sf ${
                                    activo ? "text-accent" : "text-text"
                                }`}
                            >
                                <Icono />
                                {texto}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
