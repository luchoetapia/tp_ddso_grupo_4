import { Button, Card, Skeleton } from '@/components/common'
import { formatearEntero } from '@/helpers/formatos'

const textoProyectos = (cantidad) => `${formatearEntero(cantidad)} ${cantidad === 1 ? 'proyecto' : 'proyectos'}`;

const RankingHabilidades = ({ cargando, error, datos, reintentar }) => {
    // La barra de cada habilidad es proporcional a la más pedida
    const maximo = Math.max(1, ...(datos ?? []).map((h) => h.proyectos));

    return (
        <section aria-labelledby="ranking-titulo" aria-busy={cargando} className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
                <h2 id="ranking-titulo" className="m-0 text-[26px]">Habilidades más buscadas</h2>
                <p className="m-0 text-[13px] text-muted">Según la cantidad de proyectos activos que las piden</p>
            </div>

            {cargando && (
                <Card>
                    {[1, 2, 3, 4, 5].map((n) => <Skeleton key={n} className="h-10" />)}
                    <span className="sr-only" role="status">Cargando habilidades más buscadas…</span>
                </Card>
            )}

            {!cargando && error && (
                <Card role="alert" className="items-start">
                    <p className="m-0">No pudimos cargar las habilidades más buscadas.</p>
                    <Button onClick={reintentar}>Reintentar</Button>
                </Card>
            )}

            {!cargando && !error && datos?.length === 0 && (
                <Card className="items-center text-center">
                    <p className="m-0 text-muted">Todavía no hay proyectos activos buscando habilidades.</p>
                </Card>
            )}

            {!cargando && !error && datos?.length > 0 && (
                <Card>
                    <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
                        {datos.map((habilidad, i) => (
                            <li
                                key={habilidad.id}
                                className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[44px_minmax(110px,180px)_1fr_auto]"
                            >
                                <span
                                    aria-hidden="true"
                                    className={`font-display text-[28px] leading-none font-bold ${i === 0 ? 'rounded-[10px] bg-highlight py-1.5 text-center text-[#16302b]' : 'text-accent'}`}
                                >
                                    {i + 1}
                                </span>
                                <span className="font-bold">
                                    <span className="sr-only">Puesto {i + 1}: </span>
                                    {habilidad.titulo}
                                </span>
                                <div aria-hidden="true" className="col-span-3 row-start-2 h-3 rounded-md border border-border bg-sf sm:col-span-1 sm:row-start-auto">
                                    <div className="h-full rounded-md bg-accent" style={{ width: `${(habilidad.proyectos / maximo) * 100}%` }} />
                                </div>
                                <span className="text-[13px] whitespace-nowrap text-muted">{textoProyectos(habilidad.proyectos)}</span>
                            </li>
                        ))}
                    </ol>
                </Card>
            )}
        </section>
    );
};

export default RankingHabilidades
