import Link from 'next/link'
import { Card, ProgressBar, Tag } from '@/components/common'

const MAX_HABILIDADES = 4;

// Habilidades requeridas de todos los perfiles, sin repetir
const habilidadesDe = (proyecto) => {
    const titulos = (proyecto.perfiles ?? []).flatMap((perfil) =>
        (perfil.habilidadesRequeridas ?? []).map((h) => h.titulo));
    return [...new Set(titulos)];
};

const TarjetaProyecto = ({ proyecto, destacado = false }) => {
    const habilidades = habilidadesDe(proyecto);
    const visibles = habilidades.slice(0, MAX_HABILIDADES);
    const restantes = habilidades.length - visibles.length;
    const busquedaAbierta = (proyecto.perfiles ?? []).some((perfil) => perfil.busquedaAbierta);

    return (
        <Card as="article" className="transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(22,48,43,0.12)]">
            <h3 className="m-0 text-[17px]">{proyecto.titulo}</h3>
            <div className="flex flex-wrap gap-1.5">
                {destacado && <Tag variant="highlight">Destacado</Tag>}
                {busquedaAbierta
                    ? <Tag>Búsqueda abierta</Tag>
                    : <Tag variant="neutral">Búsqueda cerrada</Tag>}
            </div>
            <p className="m-0 line-clamp-2 text-[13px] text-muted">{proyecto.descripcion}</p>
            <ProgressBar value={proyecto.porcentajeFinalizado} label="Avance" />
            {visibles.length > 0 && (
                <ul aria-label="Habilidades buscadas" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                    {visibles.map((titulo) => <li key={titulo}><Tag>{titulo}</Tag></li>)}
                    {restantes > 0 && <li><Tag variant="neutral">+{restantes}</Tag></li>}
                </ul>
            )}
            <div className="mt-auto pt-1">
                <Link
                    href={`/proyectos/ver?id=${proyecto.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-[18px] py-2 font-semibold text-text"
                >
                    Ver proyecto
                </Link>
            </div>
        </Card>
    );
};

export default TarjetaProyecto
