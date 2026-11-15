// Indicador de progreso del registro: la barra y los círculos se van llenando con animación
const LineaDePasos = ({ pasos, pasoActual }) => {
    const progreso = (Math.min(pasoActual - 1, pasos.length - 1) / (pasos.length - 1)) * 100;
    const mitadColumna = 100 / pasos.length / 2;

    return (
        <div className="relative">
            <div
                aria-hidden="true"
                className="absolute top-4 h-1 overflow-hidden rounded-md bg-border"
                style={{ left: `${mitadColumna}%`, right: `${mitadColumna}%` }}
            >
                <div
                    className="h-full rounded-md bg-accent transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: `${progreso}%` }}
                />
            </div>

            <ol
                aria-label="Pasos del registro"
                className="relative grid gap-2"
                style={{ gridTemplateColumns: `repeat(${pasos.length}, minmax(0, 1fr))` }}
            >
                {pasos.map((nombre, i) => {
                    const numero = i + 1;
                    const completo = numero < pasoActual;
                    const actual = numero === pasoActual;

                    const estiloCirculo = completo
                        ? 'border-accent bg-accent text-on-accent'
                        : actual
                            ? 'border-accent bg-card text-accent'
                            : 'border-border bg-card text-muted';

                    return (
                        <li key={nombre} aria-current={actual ? 'step' : undefined} className="flex flex-col items-center gap-2 text-center">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-[14px] font-bold transition-colors duration-300 delay-200 motion-reduce:transition-none ${estiloCirculo}`}>
                                {completo ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : numero}
                                {completo && <span className="sr-only">(completo)</span>}
                            </span>
                            <span className={`text-[13px] leading-tight ${actual ? 'font-bold text-text' : completo ? 'font-semibold text-text' : 'font-semibold text-muted'}`}>
                                {nombre}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};

export default LineaDePasos;
