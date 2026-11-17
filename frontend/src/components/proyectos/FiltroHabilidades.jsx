'use client'

import { useId, useState } from 'react'

// Panel colapsable para elegir habilidades. Arranca cerrado; la flecha apunta a la
// izquierda cerrado y hacia abajo abierto. Muestra cuántas hay elegidas aunque esté cerrado.
const FiltroHabilidades = ({ habilidades = [], seleccionadas = [], onCambiar, cargando = false }) => {
    const [abierto, setAbierto] = useState(false);
    const idPanel = useId();

    const alternar = (id) => {
        const nuevas = seleccionadas.includes(id)
            ? seleccionadas.filter((x) => x !== id)
            : [...seleccionadas, id];
        onCambiar(nuevas);
    };

    return (
        <div className="flex flex-col">
            <button
                type="button"
                aria-expanded={abierto}
                aria-controls={idPanel}
                onClick={() => setAbierto((a) => !a)}
                className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-[10px] px-1.5 py-2 font-semibold hover:bg-bg"
            >
                <span className="inline-flex items-center gap-2">
                    Filtrar por habilidades
                    {seleccionadas.length > 0 && (
                        <>
                            <span aria-hidden="true" className="rounded-full bg-accent px-2 py-px text-[12px] text-on-accent">
                                {seleccionadas.length}
                            </span>
                            <span className="sr-only">, {seleccionadas.length} seleccionadas</span>
                        </>
                    )}
                </span>
                <svg
                    width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
                    className={`transition-transform motion-reduce:transition-none ${abierto ? '-rotate-90' : ''}`}
                >
                    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {abierto && (
                <div id={idPanel} className="mt-1 flex flex-col gap-2 border-t border-border pt-3">
                    <p className="m-0 text-[13px] text-muted" id={`${idPanel}-ayuda`}>
                        Podés elegir varias. Se muestran los proyectos que buscan al menos una.
                    </p>
                    {cargando
                        ? <p className="m-0 text-[13px] text-muted" role="status">Cargando habilidades…</p>
                        : (
                            <div role="group" aria-labelledby={`${idPanel}-ayuda`} className="flex flex-wrap gap-2">
                                {habilidades.map(({ id, titulo }) => {
                                    const elegida = seleccionadas.includes(id);
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            aria-pressed={elegida}
                                            onClick={() => alternar(id)}
                                            className={`min-h-9 cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${elegida ? 'border-accent bg-accent text-on-accent' : 'border-border bg-card text-text'}`}
                                        >
                                            {titulo}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                </div>
            )}
        </div>
    );
};

export default FiltroHabilidades
