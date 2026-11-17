'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import { Button, Card, Skeleton, Tag } from '@/components/common'

const TIPOS = {
    fundacion: 'Fundación',
    asociacion_barrial: 'Asociación barrial',
    ong: 'ONG',
    asamblea: 'Asamblea',
};

const INICIAL = { cargando: true, colectivo: null, status: null };

export default function InicioColectivos() {
    const router = useRouter();
    const [estado, setEstado] = useState(INICIAL);
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        const controlador = new AbortController();
        apiQuery
            .get('/colectivos/me', { signal: controlador.signal, alertarError: false })
            .then((colectivo) => setEstado({ cargando: false, colectivo, status: null }))
            .catch((err) => {
                if (!err.cancelado) setEstado({ cargando: false, colectivo: null, status: err.status ?? 0 });
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

    const { cargando, colectivo, status } = estado;

    if (cargando) {
        return (
            <section aria-busy="true" className="flex flex-col gap-4">
                <Skeleton className="h-[160px] rounded-[22px]" />
                <Skeleton className="h-[100px] rounded-[14px]" />
                <span className="sr-only" role="status">Cargando tu inicio…</span>
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
                <p className="m-0">No pudimos cargar tu inicio.</p>
                <Button onClick={reintentar}>Reintentar</Button>
            </Card>
        );
    }

    const proyectos = colectivo.proyectos;
    const enCurso = proyectos.filter((p) => !p.finalizado).length;
    const finalizados = proyectos.length - enCurso;

    const contadores = [
        { titulo: 'Proyectos en curso', valor: enCurso },
        { titulo: 'Proyectos finalizados', valor: finalizados },
    ];

    return (
        <>
            <section
                aria-labelledby="colectivo-titulo"
                className="flex flex-col gap-2 rounded-[22px] bg-accent px-7 py-10 text-on-accent"
            >
                <p className="m-0 text-[12px] font-bold tracking-[0.12em] uppercase">
                    {TIPOS[colectivo.tipo] ?? colectivo.tipo} · {colectivo.ubicacion}
                </p>
                <h1 id="colectivo-titulo" className="m-0">{colectivo.nombre}</h1>
                <p className="m-0">{colectivo.descripcion}</p>
                {!colectivo.active && (
                    <div><Tag variant="highlight">Colectivo desactivado</Tag></div>
                )}
            </section>

            <section aria-label="Resumen" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                {contadores.map(({ titulo, valor }) => (
                    <Card key={titulo} className="gap-0.5">
                        <span className="font-display text-[38px] leading-[1.1] font-bold text-accent">{valor}</span>
                        <span className="font-semibold">{titulo}</span>
                    </Card>
                ))}
            </section>

            <section aria-labelledby="proyectos-titulo" className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 id="proyectos-titulo" className="m-0 text-[26px]">Mis proyectos</h2>
                    
                </div>

                {proyectos.length === 0 && (
                    <Card className="items-center text-center">
                        <p className="m-0 text-muted">Todavía no publicaste ningún proyecto.</p>
                    </Card>
                )}

                {proyectos.length > 0 && (
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                        {proyectos.map((proyecto) => (
                            <Card as="li" key={proyecto.id}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="m-0 font-sans text-base">{proyecto.titulo}</h3>
                                    {proyecto.finalizado
                                        ? <Tag variant="neutral">Finalizado</Tag>
                                        : <Tag>En curso</Tag>}
                                </div>
                                <div>
                                    <Link
                                        href={`/proyectos/ver?id=${proyecto.id}`}
                                        className="font-semibold text-accent underline underline-offset-4"
                                    >
                                        Ver proyecto
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