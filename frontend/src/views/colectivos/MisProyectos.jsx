'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import alertas from '@/services/alertas'
import { Button, Card, Modal, Skeleton, Tag } from '@/components/common'

const estiloLink = 'inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-[18px] py-2 font-semibold text-text';
const estiloLinkPrimario = 'inline-flex min-h-10 items-center justify-center rounded-full border border-accent bg-accent px-[18px] py-2 font-semibold text-on-accent';

const INICIAL = { cargando: true, colectivo: null, status: null };

export default function MisProyectos() {
    const router = useRouter();
    const [estado, setEstado] = useState(INICIAL);
    const [intento, setIntento] = useState(0);
    const [aCerrar, setACerrar] = useState(null);
    const [aEliminar, setAEliminar] = useState(null);
    const [procesando, setProcesando] = useState(false);

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

    const cerrarProyecto = async () => {
        const proyecto = aCerrar;
        setProcesando(true);
        try {
            await apiQuery.post(
                `/proyectos/${proyecto.id}/finalizar`,
                { idColectivo: estado.colectivo.id },
                { mensajeError: 'No se pudo cerrar el proyecto.' }
            );
            setEstado((e) => ({
                ...e,
                colectivo: {
                    ...e.colectivo,
                    proyectos: e.colectivo.proyectos.map((p) => (p.id === proyecto.id ? { ...p, finalizado: true } : p)),
                },
            }));
            alertas.exito('Proyecto cerrado.');
        } catch {
            // apiQuery ya mostró la alerta de error
        } finally {
            setProcesando(false);
            setACerrar(null);
        }
    };

    const eliminarProyecto = async () => {
        const proyecto = aEliminar;
        setProcesando(true);
        try {
            await apiQuery.delete(`/proyectos/${proyecto.id}`, { mensajeError: 'No se pudo eliminar el proyecto.' });
            setEstado((e) => ({
                ...e,
                colectivo: { ...e.colectivo, proyectos: e.colectivo.proyectos.filter((p) => p.id !== proyecto.id) },
            }));
            alertas.exito('Proyecto eliminado.');
        } catch {
            // apiQuery ya mostró la alerta de error
        } finally {
            setProcesando(false);
            setAEliminar(null);
        }
    };

    const { cargando, colectivo, status } = estado;

    return (
        <section aria-labelledby="misproyectos-titulo" aria-busy={cargando} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 id="misproyectos-titulo" className="m-0 text-[30px]">Mis proyectos</h1>
                <Link href="/colectivo/misProyectos/nuevo" className={estiloLinkPrimario}>
                    + Nuevo proyecto
                </Link>
            </div>

            {cargando && (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((n) => <Skeleton key={n} className="h-[110px] rounded-[14px]" />)}
                    <span className="sr-only" role="status">Cargando tus proyectos…</span>
                </div>
            )}

            {!cargando && status === 404 && (
                <Card role="alert" className="items-start">
                    <p className="m-0">Todavía no cargaste los datos de tu colectivo.</p>
                </Card>
            )}

            {!cargando && status !== null && status !== 403 && status !== 404 && (
                <Card role="alert" className="items-start">
                    <p className="m-0">No pudimos cargar tus proyectos.</p>
                    <Button onClick={reintentar}>Reintentar</Button>
                </Card>
            )}

            {!cargando && colectivo && colectivo.proyectos.length === 0 && (
                <Card className="items-center text-center">
                    <p className="m-0 text-muted">Todavía no publicaste ningún proyecto.</p>
                </Card>
            )}

            {!cargando && colectivo && colectivo.proyectos.length > 0 && (
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                    {colectivo.proyectos.map((proyecto) => (
                        <Card as="li" key={proyecto.id}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="m-0 font-sans text-[18px]">{proyecto.titulo}</h2>
                                {proyecto.finalizado
                                    ? <Tag variant="neutral">Cerrada</Tag>
                                    : <Tag>Abierta</Tag>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link href={`/colectivo/misProyectos/postulaciones?id=${proyecto.id}`} className={estiloLink}>
                                    Colaboradores
                                </Link>
                                <Link href={`/colectivo/misProyectos/editar?id=${proyecto.id}`} className={estiloLink}>
                                    Editar
                                </Link>
                                <Link href={`/colectivo/misProyectos/avance?id=${proyecto.id}`} className={estiloLink}>
                                    Avance
                                </Link>
                                <Link href={`/proyectos/ver?id=${proyecto.id}`} className={estiloLink}>
                                    Ver
                                </Link>
                                {!proyecto.finalizado && (
                                    <Button onClick={() => setACerrar(proyecto)}>Cerrar proyecto</Button>
                                )}
                                <Button variant="danger" onClick={() => setAEliminar(proyecto)}>Eliminar</Button>
                            </div>
                        </Card>
                    ))}
                </ul>
            )}

            <Modal
                open={aCerrar !== null}
                onClose={() => !procesando && setACerrar(null)}
                title="Cerrar proyecto"
                footer={
                    <>
                        <Button onClick={() => setACerrar(null)} disabled={procesando}>Cancelar</Button>
                        <Button variant="primary" onClick={cerrarProyecto} cargando={procesando}>
                            Cerrar proyecto
                        </Button>
                    </>
                }
            >
                {aCerrar && (
                    <p className="m-0">
                        Vas a cerrar “{aCerrar.titulo}”. Va a dejar de recibir postulaciones y no se puede volver a abrir.
                    </p>
                )}
            </Modal>

            <Modal
                open={aEliminar !== null}
                onClose={() => !procesando && setAEliminar(null)}
                title="Eliminar proyecto"
                footer={
                    <>
                        <Button onClick={() => setAEliminar(null)} disabled={procesando}>Cancelar</Button>
                        <Button variant="danger" onClick={eliminarProyecto} cargando={procesando}>
                            Eliminar definitivamente
                        </Button>
                    </>
                }
            >
                {aEliminar && (
                    <>
                        <p className="m-0">
                            Vas a eliminar “{aEliminar.titulo}” junto con sus perfiles, logros y postulaciones. Esta acción no se puede deshacer.
                        </p>
                        <p className="m-0 text-[13px] text-muted">
                            Si alguien ya colaboró en el proyecto no se puede eliminar, porque es parte de su historial: en ese caso cerralo.
                        </p>
                    </>
                )}
            </Modal>
        </section>
    );
}