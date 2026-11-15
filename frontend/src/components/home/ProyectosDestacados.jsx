import { Button, Card, Skeleton } from '@/components/common'
import TarjetaProyecto from '@/components/proyectos/TarjetaProyecto'

const grilla = 'grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3';

const ProyectosDestacados = ({ cargando, error, datos, reintentar }) => {
    return (
        <section aria-labelledby="destacados-titulo" aria-busy={cargando} className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
                <p className="eyebrow m-0">Últimos 30 días</p>
                <h2 id="destacados-titulo" className="m-0 text-[26px]">Proyectos destacados</h2>
            </div>

            {cargando && (
                <div className={grilla}>
                    {[1, 2, 3].map((n) => <Skeleton key={n} className="h-[250px] rounded-[14px]" />)}
                    <span className="sr-only" role="status">Cargando proyectos destacados…</span>
                </div>
            )}

            {!cargando && error && (
                <Card role="alert" className="items-start">
                    <p className="m-0">No pudimos cargar los proyectos destacados.</p>
                    <Button onClick={reintentar}>Reintentar</Button>
                </Card>
            )}

            {!cargando && !error && datos?.length === 0 && (
                <Card className="items-center text-center">
                    <p className="m-0 text-muted">Todavía no hay proyectos destacados en los últimos 30 días.</p>
                </Card>
            )}

            {!cargando && !error && datos?.length > 0 && (
                <div className={grilla}>
                    {datos.map((proyecto) => <TarjetaProyecto key={proyecto.id} proyecto={proyecto} destacado />)}
                </div>
            )}
        </section>
    );
};

export default ProyectosDestacados
