// Paginación reutilizable para listados paginados por la API ({ pagina, limite, total, totalPaginas }).
// Con muchas páginas muestra la primera, la última y las vecinas de la actual, con "…" entre medio.
const VECINAS = 1;

const paginasVisibles = (actual, total) => {
    const paginas = [];
    for (let n = 1; n <= total; n++) {
        if (n === 1 || n === total || Math.abs(n - actual) <= VECINAS) {
            paginas.push(n);
        } else if (paginas[paginas.length - 1] !== '…') {
            paginas.push('…');
        }
    }
    return paginas;
};

const boton = 'inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-full border px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50';

export default function Paginacion({ pagina, limite, total, totalPaginas, onCambiar, nombre = 'resultados' }) {
    if (!total) return null;

    const desde = (pagina - 1) * limite + 1;
    const hasta = Math.min(pagina * limite, total);

    return (
        <nav aria-label={`Paginación de ${nombre}`} className="flex flex-col items-center gap-2">
            <p className="m-0 text-[13px] text-muted">
                Mostrando {desde}–{hasta} de {total} {nombre}
            </p>
            {totalPaginas > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                        type="button"
                        className={`${boton} border-border bg-card text-text`}
                        disabled={pagina <= 1}
                        onClick={() => onCambiar(pagina - 1)}
                    >
                        Anterior
                    </button>
                    {paginasVisibles(pagina, totalPaginas).map((n, i) => n === '…'
                        ? <span key={`salto-${i}`} aria-hidden="true" className="px-1 text-muted">…</span>
                        : (
                            <button
                                key={n}
                                type="button"
                                aria-label={`Página ${n}`}
                                aria-current={n === pagina ? 'page' : undefined}
                                onClick={() => onCambiar(n)}
                                className={`${boton} ${n === pagina ? 'border-accent bg-accent text-on-accent' : 'border-border bg-card text-text'}`}
                            >
                                {n}
                            </button>
                        ))}
                    <button
                        type="button"
                        className={`${boton} border-border bg-card text-text`}
                        disabled={pagina >= totalPaginas}
                        onClick={() => onCambiar(pagina + 1)}
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </nav>
    );
}
