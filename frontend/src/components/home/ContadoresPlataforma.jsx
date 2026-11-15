import { formatearEntero } from '@/helpers/formatos'
import { Button, Card, Skeleton } from '@/components/common'

// Orden y textos de las cards; "clave" es el campo que devuelve GET /home/contadores
const contadores = [
    { clave: 'totalColectivos', titulo: 'Colectivos', detalle: 'confían en nosotros' },
    { clave: 'proyectosActivos', titulo: 'Proyectos activos', detalle: 'en desarrollo' },
    { clave: 'colaboradores', titulo: 'Colaboradores', detalle: 'ya colaboraron en algún proyecto' },
    { clave: 'habilidadesBuscadas', titulo: 'Habilidades', detalle: 'buscadas en los perfiles' },
];

const grilla = 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3';

const ContadoresPlataforma = ({ cargando, error, datos, reintentar }) => {
    return (
        <section aria-labelledby="numeros-titulo" aria-busy={cargando} className="flex flex-col gap-3">
            <h2 id="numeros-titulo" className="m-0 text-[26px]">La plataforma en números</h2>

            {cargando && (
                <div className={grilla}>
                    {contadores.map(({ clave }) => <Skeleton key={clave} className="h-[118px] rounded-[14px]" />)}
                    <span className="sr-only" role="status">Cargando estadísticas…</span>
                </div>
            )}

            {!cargando && error && (
                <Card role="alert" className="items-start">
                    <p className="m-0">No pudimos cargar las estadísticas de la plataforma.</p>
                    <Button onClick={reintentar}>Reintentar</Button>
                </Card>
            )}

            {!cargando && !error && datos && (
                <div className={grilla}>
                    {contadores.map(({ clave, titulo, detalle }) => (
                        <Card key={clave} className="gap-0.5">
                            <span className="font-display text-[38px] leading-[1.1] font-bold text-accent">
                                {formatearEntero(datos[clave] ?? 0)}
                            </span>
                            <span className="font-semibold">{titulo}</span>
                            <span className="text-[13px] text-muted">{detalle}</span>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    )
}

export default ContadoresPlataforma
