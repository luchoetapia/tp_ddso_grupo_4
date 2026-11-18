import { formatearEntero } from '@/helpers/formatos'
import { Button, Card, Skeleton } from '@/components/common'

// Orden y textos de las cards; "clave" es el campo que devuelve GET /home/contadores
const contadores = [
    { clave: 'proyectosTotales', titulo: 'Proyectos', detalle: 'creados en la plataforma' },
    { clave: 'proyectosActivos', titulo: 'Proyectos activos', detalle: 'en desarrollo' },
    { clave: 'colectivosTotales', titulo: 'Colectivos', detalle: 'registrados en la plataforma' },
    { clave: 'colaboradores', titulo: 'Colaboradores', detalle: 'distintos participaron en proyectos' },
    { clave: 'colaboracionesTotales', titulo: 'Colaboraciones', detalle: 'totales registradas' },
    { clave: 'colaboracionesActivas', titulo: 'Colaboraciones activas', detalle: 'en curso' }
];

const grilla = 'grid grid-cols-2 gap-3 lg:grid-cols-3';

const valorContador = (datos, clave) => {
    if (datos[clave] !== undefined) return datos[clave];

    if (clave === 'proyectosTotales') {
        return (datos.proyectosActivos ?? 0) + (datos.proyectosFinalizados ?? 0);
    }

    if (clave === 'colectivosTotales') {
        return datos.totalColectivos ?? 0;
    }

    return 0;
};

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
                        <Card key={clave} className="min-w-0 gap-0.5">
                            <span className="font-display text-[38px] leading-[1.1] font-bold text-accent">
                                {formatearEntero(valorContador(datos, clave))}
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
