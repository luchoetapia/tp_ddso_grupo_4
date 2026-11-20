'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import alertas from '@/services/alertas'
import { Button, Card, Modal, Skeleton, Tag } from '@/components/common'
import { formatearFechaHora } from '@/helpers/formatos'

const varianteEstado = { Pendiente: 'highlight', Aceptada: 'accent', Rechazada: 'neutral' };

const nombreVisible = (c) => {
    if (!c) return 'Colaborador anónimo';
    return c.nombreFantasia || [c.nombre, c.apellido].filter(Boolean).join(' ') || c.cuentaGit || 'Sin nombre';
};

// Postulaciones y colaboraciones activas de un proyecto del colectivo
export default function PostulacionesProyecto() {
    const idProyecto = useSearchParams().get('id');

    const [proyecto, setProyecto] = useState(null);
    const [postulaciones, setPostulaciones] = useState(null);
    const [colaboraciones, setColaboraciones] = useState(null);
    const [error, setError] = useState(null);
    const [procesando, setProcesando] = useState(null);

    // Modal de confirmación para desanotar
    const [colaboracionADesanotar, setColaboracionADesanotar] = useState(null);
    const [desanotando, setDesanotando] = useState(false);

    useEffect(() => {
        if (!idProyecto) return;
        const controlador = new AbortController();
        const opciones = { signal: controlador.signal, alertarError: false };

        Promise.all([
            apiQuery.get(`/proyectos/${idProyecto}`, opciones),
            apiQuery.get('/postulaciones', { ...opciones, params: { idProyecto } }),
            apiQuery.get(`/colaboraciones/proyecto/${idProyecto}`, opciones),
        ])
            .then(([datosProyecto, datosPostulaciones, datosColaboraciones]) => {
                setProyecto(datosProyecto);
                setPostulaciones(datosPostulaciones);
                setColaboraciones(datosColaboraciones || []);
            })
            .catch((e) => {
                if (!e.cancelado) setError(e.mensaje ?? 'No se pudieron cargar los datos del proyecto.');
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

    const handleDesanotar = async () => {
        if (!colaboracionADesanotar) return;
        setDesanotando(true);
        try {
            await apiQuery.post(
                `/colaboraciones/${colaboracionADesanotar.id}/desanotar`,
                {},
                { mensajeError: 'No se pudo desanotar al colaborador.' }
            );
            alertas.exito(`Se dio de baja la colaboración de ${nombreVisible(colaboracionADesanotar.colaborador)}.`);
            setColaboraciones((actuales) =>
                actuales.filter((c) => c.id !== colaboracionADesanotar.id)
            );
            setColaboracionADesanotar(null);
        } catch {
            // apiQuery ya gestiona la alerta de error
        } finally {
            setDesanotando(false);
        }
    };

    if (!idProyecto || error) {
        return (
            <p role="alert" className="text-error">
                {error ?? 'No se indicó de qué proyecto ver las postulaciones.'}
            </p>
        );
    }

    if (!proyecto || !postulaciones || !colaboraciones) {
        return (
            <section aria-busy="true" className="flex flex-col gap-3">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton />
                <Skeleton />
            </section>
        );
    }

    const colaboracionesActivas = colaboraciones.filter((c) => !c.fin);

    return (
        <section className="flex flex-col gap-6">
            <header className="flex flex-col gap-1">
                <Link href="/colectivo/misProyectos" className="text-[13px] text-muted underline">
                    ← Mis proyectos
                </Link>
                <h1>Postulaciones</h1>
                <p className="text-muted">{proyecto.titulo}</p>
            </header>

            {/* Sección 1: Colaboraciones Activas */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Colaboraciones Activas</h2>
                    <Tag variant="neutral">
                        {colaboracionesActivas.length} colaboraci{colaboracionesActivas.length === 1 ? 'ón' : 'ones'}
                    </Tag>
                </div>

                {colaboracionesActivas.length === 0 ? (
                    <Card className="items-center text-center">
                        <p className="text-muted">No hay colaboraciones activas en este proyecto.</p>
                    </Card>
                ) : (
                    <ul className="flex list-none flex-col gap-3 p-0">
                        {colaboracionesActivas.map((colaboracion) => (
                            <Card as="li" key={colaboracion.id}>
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h3 className="text-base font-semibold">
                                        {colaboracion.esAnonima ? (
                                            <span className="italic text-muted">Colaborador anónimo</span>
                                        ) : (
                                            <span>{nombreVisible(colaboracion.colaborador)}</span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {colaboracion.inicio && (
                                            <time dateTime={colaboracion.inicio} className="text-[13px] text-muted">
                                                Desde {formatearFechaHora(colaboracion.inicio)}
                                            </time>
                                        )}
                                        <Tag variant="accent">Activa</Tag>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <Button
                                        variant="danger"
                                        onClick={() => setColaboracionADesanotar(colaboracion)}
                                    >
                                        Desanotar
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </ul>
                )}
            </section>

            {/* Sección 2: Postulaciones */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Postulaciones</h2>
                    <Tag variant="neutral">
                        {postulaciones.length} postulaci{postulaciones.length === 1 ? 'ón' : 'ones'}
                    </Tag>
                </div>

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
                                <h3 id={`perfil-${perfil.id}`} className="font-sans text-[17px] font-bold">
                                    {perfil.titulo}
                                </h3>
                                {!perfil.busquedaAbierta && <Tag variant="neutral">Búsqueda cerrada</Tag>}
                            </div>

                            <ul className="flex flex-col gap-3">
                                {delPerfil.map((p) => {
                                    const urlPerfil = `/colaboradoras/perfil?cuentaGit=${encodeURIComponent(p.colaborador.cuentaGit)}`;
                                    return (
                                        <Card as="li" key={p.id}>
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <h4 className="text-base font-semibold">
                                                    <Link href={urlPerfil} className="underline">
                                                        {nombreVisible(p.colaborador)}
                                                    </Link>
                                                    <span className="ml-2 text-[13px] font-normal text-muted">@{p.colaborador.cuentaGit}</span>
                                                </h4>
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

            {/* Modal de confirmación para desanotar */}
            <Modal
                open={colaboracionADesanotar !== null}
                onClose={() => !desanotando && setColaboracionADesanotar(null)}
                title="Confirmar desanotación"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setColaboracionADesanotar(null)}
                            disabled={desanotando}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDesanotar}
                            cargando={desanotando}
                        >
                            Confirmar desanotación
                        </Button>
                    </>
                }
            >
                {colaboracionADesanotar && (
                    <p className="text-sm">
                        ¿Estás seguro de que querés desanotar a{' '}
                        <strong>{nombreVisible(colaboracionADesanotar.colaborador)}</strong> de este proyecto? Esta acción no se puede revertir.
                    </p>
                )}
            </Modal>
        </section>
    );
}
