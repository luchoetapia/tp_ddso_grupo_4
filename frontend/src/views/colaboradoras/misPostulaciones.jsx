'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import apiQuery from "@/services/api/apiQuery"
import alertas from "@/services/alertas"
import { Button, Card, Modal, Skeleton, Tag } from "@/components/common"
import { formatearFecha } from "@/helpers/formatos"

const varianteEstado = {
    Pendiente: "highlight",
    Aceptada: "accent",
    Rechazada: "neutral",
};

const estiloLink =
    "inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-[18px] py-2 font-semibold text-text";

export default function MisPostulaciones() {
    const [postulaciones, setPostulaciones] = useState([]);
    const [colaboraciones, setColaboraciones] = useState([]);
    const [colaboradora, setColaboradora] = useState(null);
    const [cargando, setCargando] = useState(true);

    // Estado para el modal de desanotarse
    const [itemADesanotar, setItemADesanotar] = useState(null);
    const [desanotando, setDesanotando] = useState(false);

    useEffect(() => {
        const controlador = new AbortController();

        apiQuery
            .get('/colaboradores/me', { signal: controlador.signal, alertarError: false })
            .then((colaboradoraData) => setColaboradora(colaboradoraData))
            .catch((e) => {
                if (!e.cancelado && e.name !== 'AbortError') {
                    console.error(e);
                }
            })
            .finally(() => setCargando(false));

        return () => controlador.abort();
    }, []);

    useEffect(() => {
        if (!colaboradora?.id) return;

        const controlador = new AbortController();

        apiQuery
            .get('/postulaciones', {
                signal: controlador.signal,
                alertarError: false,
                params: { idColaborador: colaboradora.id }
            })
            .then((data) => setPostulaciones(data || []))
            .catch((e) => {
                if (!e.cancelado && e.name !== 'AbortError') {
                    console.error(e);
                }
            });

        apiQuery
            .get(`/colaboraciones/colaborador/${colaboradora.id}`, {
                signal: controlador.signal,
                alertarError: false,
                params: {}
            })
            .then((data) => setColaboraciones(data || []))
            .catch((e) => {
                if (!e.cancelado && e.name !== 'AbortError') {
                    console.error(e);
                }
            });

        return () => controlador.abort();
    }, [colaboradora]);

    const handleDesanotar = async () => {
        if (!itemADesanotar) return;
        setDesanotando(true);
        try {
            await apiQuery.post(
                `/colaboraciones/${itemADesanotar.id}/desanotar`,
                {},
                { mensajeError: 'No se pudo procesar la baja de la colaboración.' }
            );
            alertas.exito('Te desanotaste exitosamente de la colaboración.');
            // Actualizar el estado local
            setColaboraciones((prev) => prev.filter((c) => c.id !== itemADesanotar.id));
            setPostulaciones((prev) =>
                prev.filter((p) => p.id !== itemADesanotar.id && p.colaboracionId !== itemADesanotar.id)
            );
            setItemADesanotar(null);
        } catch {
            // El error ya fue alertado por apiQuery
        } finally {
            setDesanotando(false);
        }
    };

    if (cargando) {
        return (
            <section aria-busy="true" className="flex flex-col gap-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </section>
        );
    }

    if (!colaboradora) {
        return (
            <Card className="items-center text-center">
                <h1 className="text-xl font-bold">No se pudo encontrar tu perfil</h1>
                <p className="text-muted">Iniciá sesión para ver tus colaboraciones y postulaciones.</p>
            </Card>
        );
    }

    // Filtrar colaboraciones activas (sin fecha de fin o con fin posterior a hoy)
    const hoy = new Date();
    const colaboracionesActivas = colaboraciones.filter((c) => !c.fin || new Date(c.fin) > hoy);

    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">
                    Mis postulaciones y colaboraciones
                </h1>
                <p className="text-muted">
                    Bienvenido, {colaboradora.nombre} {colaboradora.apellido}
                </p>
            </header>

            {/* Primera sección: Colaboraciones activas */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Colaboraciones activas</h2>
                    <Tag variant="accent">
                        {colaboracionesActivas.length} activa{colaboracionesActivas.length === 1 ? '' : 's'}
                    </Tag>
                </div>

                {colaboracionesActivas.length === 0 ? (
                    <Card className="items-center text-center">
                        <p className="text-muted">Actualmente no estás participando activamente en ningún proyecto.</p>
                    </Card>
                ) : (
                    <ul className="flex list-none flex-col gap-3 p-0">
                        {colaboracionesActivas.map((colaboracion) => {
                            const idProyecto = colaboracion.proyecto?.id || colaboracion.proyecto;
                            const tituloProyecto = colaboracion.proyecto?.titulo || 'Proyecto sin título';

                            return (
                                <Card as="li" key={colaboracion.id} className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-col gap-0.5">
                                            <h3 className="text-lg font-semibold">{tituloProyecto}</h3>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                                                {colaboracion.inicio && (
                                                    <span>Inicio: {formatearFecha(colaboracion.inicio)}</span>
                                                )}
                                                {colaboracion.fin && (
                                                    <span>Fin: {formatearFecha(colaboracion.fin)}</span>
                                                )}
                                                {colaboracion.esAnonima && (
                                                    <Tag variant="neutral">Colaboración anónima</Tag>
                                                )}
                                            </div>
                                        </div>
                                        <Tag variant="accent">En curso</Tag>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        {idProyecto && (
                                            <Link href={`/proyectos/ver?id=${idProyecto}`} className={estiloLink}>
                                                Ver proyecto
                                            </Link>
                                        )}
                                        <Button
                                            variant="danger"
                                            onClick={() =>
                                                setItemADesanotar({
                                                    id: colaboracion.id,
                                                    titulo: tituloProyecto,
                                                    tipo: 'colaboración',
                                                })
                                            }
                                        >
                                            Desanotarse
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Segunda sección: Postulaciones */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Mis postulaciones</h2>
                    <Tag variant="neutral">
                        {postulaciones.length} postulación{postulaciones.length === 1 ? '' : 'es'}
                    </Tag>
                </div>

                {postulaciones.length === 0 ? (
                    <Card className="items-center text-center">
                        <p className="text-muted">No realizaste ninguna postulación todavía.</p>
                    </Card>
                ) : (
                    <ul className="flex list-none flex-col gap-3 p-0">
                        {postulaciones.map((postulacion) => {
                            const idProyecto = postulacion.proyecto?.id || postulacion.proyecto;
                            const tituloProyecto = postulacion.proyecto?.titulo || 'Proyecto';
                            const estadoNormalizado = postulacion.estado
                                ? postulacion.estado.charAt(0).toUpperCase() + postulacion.estado.slice(1).toLowerCase()
                                : 'Pendiente';
                            const esAceptada = estadoNormalizado === 'Aceptada';

                            return (
                                <Card as="li" key={postulacion.id} className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <div className="flex flex-col gap-0.5">
                                            <h3 className="text-lg font-semibold">{tituloProyecto}</h3>
                                            {postulacion.fecha && (
                                                <time className="text-xs text-muted">
                                                    Postulado el {formatearFecha(postulacion.fecha)}
                                                </time>
                                            )}
                                        </div>
                                        <Tag variant={varianteEstado[estadoNormalizado] ?? 'neutral'}>
                                            {postulacion.estado}
                                        </Tag>
                                    </div>

                                    {postulacion.mensaje && (
                                        <div className="rounded-[10px] bg-sf/60 p-3 text-sm">
                                            <p className="font-semibold text-muted text-xs mb-1">Mensaje enviado:</p>
                                            <p className="whitespace-pre-wrap">{postulacion.mensaje}</p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        {idProyecto && (
                                            <Link href={`/proyectos/ver?id=${idProyecto}`} className={estiloLink}>
                                                Ver proyecto
                                            </Link>
                                        )}
                                        {esAceptada && (
                                            <Button
                                                variant="danger"
                                                onClick={() =>
                                                    setItemADesanotar({
                                                        id: postulacion.id,
                                                        titulo: tituloProyecto,
                                                        tipo: 'postulación',
                                                    })
                                                }
                                            >
                                                Darse de baja
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Modal de confirmación para desanotarse / darse de baja */}
            <Modal
                open={itemADesanotar !== null}
                onClose={() => !desanotando && setItemADesanotar(null)}
                title="Confirmar baja"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setItemADesanotar(null)}
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
                {itemADesanotar && (
                    <p className="text-sm">
                        ¿Estás seguro de que querés desanotarte de <strong>{itemADesanotar.titulo}</strong>? Esta acción no se puede revertir.
                    </p>
                )}
            </Modal>
        </div>
    );
}
