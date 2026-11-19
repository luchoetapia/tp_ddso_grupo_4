'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import { Button, Card, ProgressBar, Skeleton, Tag } from '@/components/common'

const TIPOS = {
    fundacion: 'Fundación',
    asociacion_barrial: 'Asociación barrial',
    ong: 'ONG',
    asamblea: 'Asamblea',
};

// Cuántos proyectos activos se muestran en el panel; el resto queda en "Mis proyectos"
const MAX_PROYECTOS = 6;

const INICIAL = { cargando: true, colectivo: null, estadisticas: null, status: null };

const estiloLink = 'inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-[18px] py-2 font-semibold text-text';
const estiloAcceso = 'flex min-h-16 items-center gap-3 rounded-[14px] border px-4 py-3.5 font-semibold shadow-[0_1px_2px_rgba(22,48,43,0.06)]';

const propsIcono = {
    width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
    className: 'shrink-0',
};

const ACCESOS = [
    {
        href: '/colectivo/misProyectos/nuevo',
        titulo: 'Nuevo proyecto',
        detalle: 'Cargar proyecto y perfiles',
        primario: true,
        icono: <svg {...propsIcono}><path d="M12 5v14M5 12h14" /></svg>,
    },
    {
        href: '/colectivo/misProyectos',
        titulo: 'Postulaciones',
        detalle: 'Aceptar o rechazar',
        contador: 'postulacionesPendientes',
        icono: <svg {...propsIcono}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
    },
    {
        href: '/colaboradoras',
        titulo: 'Buscar colaboradoras',
        detalle: 'Por perfil y habilidades',
        icono: <svg {...propsIcono}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>,
    },
    {
        href: '/mensajes',
        titulo: 'Mensajes',
        detalle: 'Contacto interno',
        icono: <svg {...propsIcono}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    },
];

const ESTADISTICAS = [
    { clave: 'proyectosActivos', titulo: 'Proyectos activos' },
    { clave: 'proyectosTotales', titulo: 'Proyectos totales' },
    { clave: 'colaboracionesActivas', titulo: 'Colaboraciones activas' },
    { clave: 'colaboracionesTotales', titulo: 'Colaboraciones totales' },
];

const textoPerfiles = (cantidad) => {
    if (!cantidad) return 'Sin perfiles abiertos';
    return cantidad === 1 ? '1 perfil abierto' : `${cantidad} perfiles abiertos`;
};

export default function InicioColectivos() {
    const router = useRouter();
    const [estado, setEstado] = useState(INICIAL);
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        const controlador = new AbortController();
        const opciones = { signal: controlador.signal, alertarError: false };

        // Las estadísticas no son imprescindibles: si fallan, el panel se muestra igual sin los números
        Promise.allSettled([
            apiQuery.get('/colectivos/me', opciones),
            apiQuery.get('/colectivos/me/estadisticas', opciones),
        ]).then(([me, estadisticas]) => {
            if (controlador.signal.aborted) return;
            if (me.status === 'rejected') {
                if (!me.reason.cancelado) setEstado({ ...INICIAL, cargando: false, status: me.reason.status ?? 0 });
                return;
            }
            setEstado({
                cargando: false,
                colectivo: me.value,
                estadisticas: estadisticas.status === 'fulfilled' ? estadisticas.value : null,
                status: null,
            });
        });
        return () => controlador.abort();
    }, [intento]);

    useEffect(() => {
        if (estado.status === 403) router.replace('/');
    }, [estado.status, router]);

    const reintentar = () => {
        setEstado(INICIAL);
        setIntento((n) => n + 1);
    };

    const { cargando, colectivo, estadisticas, status } = estado;

    if (cargando) {
        return (
            <section aria-busy="true" className="flex flex-col gap-4">
                <Skeleton className="h-[260px] rounded-[14px]" />
                <Skeleton className="h-[64px] rounded-[14px]" />
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
                    {[1, 2, 3].map((n) => <Skeleton key={n} className="h-[200px] rounded-[14px]" />)}
                </div>
                <span className="sr-only" role="status">Cargando tu panel…</span>
            </section>
        );
    }

    if (status === 403) return null;

    if (status === 404) {
        return (
            <Card role="alert" className="items-start">
                <p className="m-0">Todavía no cargaste los datos de tu colectivo.</p>
            </Card>
        );
    }

    if (status !== null) {
        return (
            <Card role="alert" className="items-start">
                <p className="m-0">No pudimos cargar tu panel.</p>
                <Button onClick={reintentar}>Reintentar</Button>
            </Card>
        );
    }

    const proyectosActivos = colectivo.proyectos.filter((p) => !p.finalizado);
    const proyectosVisibles = proyectosActivos.slice(0, MAX_PROYECTOS);

    return (
        <>
            {/* Card de inicio: datos de la organización + estadísticas */}
            <Card as="section" aria-labelledby="colectivo-titulo" className="gap-3.5 p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="m-0 flex-1 text-[12px] font-bold tracking-[0.12em] text-muted uppercase">Panel del colectivo</p>
                    <Link href="/colectivo/perfil" className={estiloLink}>Editar datos</Link>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <h1 id="colectivo-titulo" className="m-0 text-[34px] leading-[1.1]">{colectivo.nombre}</h1>
                    {!colectivo.active && <Tag variant="error">Colectivo desactivado</Tag>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Tag variant="highlight">{TIPOS[colectivo.tipo] ?? colectivo.tipo}</Tag>
                    {colectivo.ubicacion && (
                        <p className="m-0 flex items-center gap-1.5 text-[13px] text-muted">
                            <svg {...propsIcono} width={16} height={16}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                            {colectivo.ubicacion}
                        </p>
                    )}
                </div>
                {colectivo.descripcion && <p className="m-0 max-w-[720px]">{colectivo.descripcion}</p>}

                <hr className="my-1.5 border-0 border-t border-border" />

                {estadisticas ? (
                    <ul aria-label="Estadísticas del colectivo" className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 p-0">
                        {ESTADISTICAS.map(({ clave, titulo }) => (
                            <li key={clave} className="flex flex-col gap-0.5 rounded-[10px] bg-bg px-3.5 py-3">
                                <span className="font-display text-[38px] leading-[1.1] font-bold text-accent">{estadisticas[clave]}</span>
                                <span className="text-[13px] text-muted">{titulo}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="m-0 flex-1 text-[13px] text-muted">No pudimos cargar las estadísticas.</p>
                        <Button variant="link" onClick={reintentar}>Reintentar</Button>
                    </div>
                )}
            </Card>

            {/* Accesos rápidos */}
            <section aria-labelledby="accesos-titulo" className="flex flex-col gap-3">
                <h2 id="accesos-titulo" className="m-0 text-[20px]">Accesos rápidos</h2>
                <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 p-0">
                    {ACCESOS.map(({ href, titulo, detalle, primario, contador, icono }) => {
                        const cantidad = contador ? estadisticas?.[contador] : 0;
                        return (
                            <li key={href} className="flex">
                                <Link
                                    href={href}
                                    className={`${estiloAcceso} flex-1 ${primario ? 'border-accent bg-accent text-on-accent' : 'border-border bg-card text-text'}`}
                                >
                                    <span className={primario ? '' : 'text-accent'}>{icono}</span>
                                    <span className="flex flex-col">
                                        {titulo}
                                        <small className={`text-[13px] font-normal ${primario ? '' : 'text-muted'}`}>{detalle}</small>
                                    </span>
                                    {cantidad > 0 && (
                                        <span className="ml-auto rounded-full bg-highlight px-2 py-0.5 text-xs font-bold text-[#16302b]">
                                            {cantidad}
                                            <span className="sr-only"> pendientes</span>
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {/* Mis proyectos activos */}
            <section aria-labelledby="proyectos-titulo" className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 id="proyectos-titulo" className="m-0 text-[20px]">Mis proyectos activos</h2>
                    <Link href="/colectivo/misProyectos" className="px-3 py-2 font-semibold text-accent underline underline-offset-4">
                        Ver todos
                    </Link>
                </div>

                {proyectosActivos.length === 0 ? (
                    <Card className="items-center text-center">
                        <p className="m-0 text-muted">No tenés proyectos activos.</p>
                        <Link href="/colectivo/misProyectos/nuevo" className="font-semibold text-accent underline underline-offset-4">
                            Cargar un proyecto
                        </Link>
                    </Card>
                ) : (
                    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3 p-0">
                        {proyectosVisibles.map((proyecto) => (
                            <Card as="li" key={proyecto.id}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="m-0 font-sans text-[17px]">{proyecto.titulo}</h3>
                                    {proyecto.perfilesAbiertos > 0
                                        ? <Tag>Búsqueda abierta</Tag>
                                        : <Tag variant="neutral">Búsqueda cerrada</Tag>}
                                </div>
                                {proyecto.descripcion && (
                                    <p className="m-0 line-clamp-2 text-[13px] text-muted">{proyecto.descripcion}</p>
                                )}
                                <ProgressBar value={proyecto.porcentajeFinalizado} label="Avance" />
                                <p className="m-0 text-[13px] text-muted">{textoPerfiles(proyecto.perfilesAbiertos)}</p>
                                <div className="mt-auto flex flex-wrap gap-2">
                                    <Link href={`/proyectos/ver?id=${proyecto.id}`} className={estiloLink}>Ver</Link>
                                    <Link href={`/colectivo/misProyectos/postulaciones?id=${proyecto.id}`} className={estiloLink}>
                                        Postulaciones
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}
