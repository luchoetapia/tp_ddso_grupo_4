'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import alertas from '@/services/alertas'
import { Button, Card, Skeleton, Tag } from '@/components/common'
import { formatearFechaHora } from '@/helpers/formatos'

const varianteEstado = { Pendiente: 'highlight', Aceptada: 'accent', Rechazada: 'neutral' };

const nombreVisible = (c) => c.nombreFantasia || [c.nombre, c.apellido].filter(Boolean).join(' ') || c.cuentaGit;

// Postulaciones de un proyecto del colectivo, agrupadas por perfil, para aceptarlas o rechazarlas
export default function PostulacionesProyecto() {
    const idProyecto = useSearchParams().get('id');

    const [proyecto, setProyecto] = useState(null);
    const [postulaciones, setPostulaciones] = useState(null);
    const [error, setError] = useState(null);
    const [procesando, setProcesando] = useState(null);

    useEffect(() => {
        if (!idProyecto) return;
        const controlador = new AbortController();
        const opciones = { signal: controlador.signal, alertarError: false };

        Promise.all([
            apiQuery.get(`/proyectos/${idProyecto}`, opciones),
            apiQuery.get('/postulaciones', { ...opciones, params: { idProyecto } }),
        ])
            .then(([datosProyecto, datosPostulaciones]) => {
                setProyecto(datosProyecto);
                setPostulaciones(datosPostulaciones);
            })
            .catch((e) => {
                if (!e.cancelado) setError(e.mensaje ?? 'No se pudieron cargar las postulaciones.');
            });
        return () => controlador.abort();
    }, [idProyecto]);

    const cambiarEstado = async (postulacion, estado) => {
        setProcesando(postulacion.id);
        try {
            await apiQuery.patch(
                `/postulaciones/${postulacion.id}/estado`,
                { estado },
                { mensajeError: 'No se pudo actualizar la postulación.' }
            );
            setPostulaciones((actuales) => actuales.map((p) => (p.id === postulacion.id ? { ...p, estado } : p)));
            alertas.exito(
                estado === 'Aceptada'
                    ? `Aceptaste a ${nombreVisible(postulacion.colaborador)}. Ya podés ver sus datos de contacto.`
                    : `Rechazaste la postulación de ${nombreVisible(postulacion.colaborador)}.`
            );
        } catch {
            // apiQuery ya mostró la alerta (p. ej. se llegó al límite de colaboraciones del perfil)
        } finally {
            setProcesando(null);
        }
    };

    if (!idProyecto || error) {
        return (
            <p role="alert" className="text-error">
                {error ?? 'No se indicó de qué proyecto ver las postulaciones.'}
            </p>
        );
    }

    if (!proyecto || !postulaciones) {
        return (
            <section aria-busy="true" className="flex flex-col gap-3">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton />
                <Skeleton />
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-6">
            <header className="flex flex-col gap-1">
                <Link href="/colectivo/misProyectos" className="text-[13px] text-muted underline">
                    ← Mis proyectos
                </Link>
                <h1>Postulaciones</h1>
                <p className="text-muted">{proyecto.titulo}</p>
            </header>

            {postulaciones.length === 0 && (
                <Card className="items-center text-center">
                    <p className="text-muted">Todavía nadie se postuló a este proyecto.</p>
                </Card>
            )}

            {proyecto.perfiles.map((perfil) => {
                const delPerfil = postulaciones
                    .filter((p) => p.idPerfil === perfil.id)
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                if (delPerfil.length === 0) return null;

                return (
                    <section key={perfil.id} aria-labelledby={`perfil-${perfil.id}`} className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 id={`perfil-${perfil.id}`} className="font-sans text-[17px] font-bold">
                                {perfil.titulo}
                            </h2>
                            {!perfil.busquedaAbierta && <Tag variant="neutral">Búsqueda cerrada</Tag>}
                        </div>

                        <ul className="flex flex-col gap-3">
                            {delPerfil.map((p) => {
                                const urlPerfil = `/colaboradoras/perfil?cuentaGit=${encodeURIComponent(p.colaborador.cuentaGit)}`;
                                return (
                                    <Card as="li" key={p.id}>
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <h3 className="text-base font-semibold">
                                                <Link href={urlPerfil} className="underline">
                                                    {nombreVisible(p.colaborador)}
                                                </Link>
                                                <span className="ml-2 text-[13px] font-normal text-muted">@{p.colaborador.cuentaGit}</span>
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <time dateTime={p.fecha} className="text-[13px] text-muted">
                                                    {formatearFechaHora(p.fecha)}
                                                </time>
                                                <Tag variant={varianteEstado[p.estado]}>{p.estado}</Tag>
                                            </div>
                                        </div>

                                        {p.mensaje && <p>{p.mensaje}</p>}

                                        {p.estado === 'Pendiente' && (
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="primary"
                                                    cargando={procesando === p.id}
                                                    disabled={procesando !== null}
                                                    onClick={() => cambiarEstado(p, 'Aceptada')}
                                                >
                                                    Aceptar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    disabled={procesando !== null}
                                                    onClick={() => cambiarEstado(p, 'Rechazada')}
                                                >
                                                    Rechazar
                                                </Button>
                                            </div>
                                        )}

                                        {p.estado === 'Aceptada' && (
                                            <div>
                                                <Link href={urlPerfil} className="font-semibold text-accent underline">
                                                    Ver perfil y datos de contacto
                                                </Link>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}
        </section>
    );
}
