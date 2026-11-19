'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import alertas from '@/services/alertas'
import { Button, Card, Input, Modal, ProgressBar, Skeleton, Textarea } from '@/components/common'
import { formatearFecha } from '@/helpers/formatos'

const estiloLink = 'inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-[18px] py-2 font-semibold text-text';

const esUrl = (texto) => {
    try {
        const url = new URL(texto);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const estadoDesdeApi = (p) => ({
    porcentajeFinalizado: String(p.porcentajeFinalizado ?? 0),
    enlaceCodigoFuente: p.enlaceCodigoFuente ?? '',
    enlaceSistema: p.enlaceSistema ?? '',
});

const validarEstado = (estado) => {
    const errores = {};
    const porcentaje = Number(estado.porcentajeFinalizado);
    if (estado.porcentajeFinalizado === '' || Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
        errores.porcentajeFinalizado = 'Ingresá un porcentaje entre 0 y 100.';
    }
    for (const campo of ['enlaceCodigoFuente', 'enlaceSistema']) {
        if (estado[campo].trim() && !esUrl(estado[campo].trim())) errores[campo] = 'Ingresá una URL válida (https://…).';
    }
    return errores;
};

// Solo lo que cambió; un enlace vaciado se manda como null para borrarlo
const cambiosDelEstado = (guardado, estado) => {
    const cambios = {};
    if (Number(estado.porcentajeFinalizado) !== Number(guardado.porcentajeFinalizado)) {
        cambios.porcentajeFinalizado = Number(estado.porcentajeFinalizado);
    }
    for (const campo of ['enlaceCodigoFuente', 'enlaceSistema']) {
        const valor = estado[campo].trim();
        if (valor !== guardado[campo]) cambios[campo] = valor === '' ? null : valor;
    }
    return cambios;
};

const ordenarPorFecha = (logros) => [...logros].sort((a, b) => new Date(b.fecha ?? 0) - new Date(a.fecha ?? 0));

const logroVacio = { titulo: '', descripcion: '' };

const validarLogro = (logro) => {
    const errores = {};
    if (!logro.titulo.trim()) errores.titulo = 'Poné un título al logro.';
    if (!logro.descripcion.trim()) errores.descripcion = 'Contá qué se logró.';
    return errores;
};

const FormularioLogro = ({ inicial = logroVacio, textoEnviar, onEnviar, onCancelar }) => {
    const [logro, setLogro] = useState(inicial);
    const [mostrarErrores, setMostrarErrores] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const errores = validarLogro(logro);

    const enviar = async (e) => {
        e.preventDefault();
        setMostrarErrores(true);
        if (Object.keys(errores).length) return;

        setEnviando(true);
        const ok = await onEnviar({ titulo: logro.titulo.trim(), descripcion: logro.descripcion.trim() });
        setEnviando(false);
        if (ok && !onCancelar) {
            // Alta: se limpia el formulario para cargar el siguiente
            setLogro(logroVacio);
            setMostrarErrores(false);
        }
    };

    const campo = (nombre) => ({
        name: nombre,
        value: logro[nombre],
        error: mostrarErrores ? errores[nombre] : undefined,
        onChange: (e) => setLogro((l) => ({ ...l, [nombre]: e.target.value })),
    });

    return (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-3">
            <Input label="Título del logro" placeholder="Ej.: Primera versión publicada" {...campo('titulo')} required />
            <Textarea label="Descripción" rows={3} placeholder="¿Qué se concretó?" {...campo('descripcion')} required />
            <div className="flex flex-wrap justify-end gap-2">
                {onCancelar && <Button onClick={onCancelar} disabled={enviando}>Cancelar</Button>}
                <Button type="submit" variant="primary" cargando={enviando}>{textoEnviar}</Button>
            </div>
        </form>
    );
};

export default function AvanceProyecto() {
    const router = useRouter();
    const id = useSearchParams().get('id');

    const [proyecto, setProyecto] = useState(null); 
    const [guardado, setGuardado] = useState(null);
    const [estado, setEstado] = useState(null);
    const [logros, setLogros] = useState([]);
    const [error, setError] = useState(null);
    const [intento, setIntento] = useState(0);
    const [mostrarErrores, setMostrarErrores] = useState(false);
    const [guardandoEstado, setGuardandoEstado] = useState(false);
    const [editando, setEditando] = useState(null);
    const [aEliminar, setAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    useEffect(() => {
        if (!id) return;
        const controlador = new AbortController();
        Promise.all([
            apiQuery.get(`/proyectos/${id}`, { signal: controlador.signal, alertarError: false, mensajeError: 'No se pudo cargar el proyecto.' }),
            apiQuery.get('/colectivos/me', { signal: controlador.signal, alertarError: false }),
        ])
            .then(([datos, colectivo]) => {
                if (!colectivo.proyectos.some((p) => p.id === datos.id)) {
                    setError('Este proyecto no pertenece a tu organización.');
                    return;
                }
                setProyecto({ id: datos.id, titulo: datos.titulo, finalizado: datos.finalizado });
                setGuardado(estadoDesdeApi(datos));
                setEstado(estadoDesdeApi(datos));
                setLogros(ordenarPorFecha(datos.logros ?? []));
            })
            .catch((err) => {
                if (err.cancelado) return;
                if (err.status === 403) router.replace('/');
                else setError(err.mensaje ?? 'No se pudo cargar el proyecto.');
            });
        return () => controlador.abort();
    }, [id, intento, router]);

    const erroresEstado = estado ? validarEstado(estado) : {};
    const cambios = estado ? cambiosDelEstado(guardado, estado) : {};
    const hayCambios = Object.keys(cambios).length > 0;
    const soloLectura = proyecto?.finalizado;

    const campoEstado = (nombre) => ({
        name: nombre,
        value: estado[nombre],
        error: mostrarErrores ? erroresEstado[nombre] : undefined,
        disabled: soloLectura,
        onChange: (e) => setEstado((s) => ({ ...s, [nombre]: e.target.value })),
    });

    const guardarEstado = async (e) => {
        e.preventDefault();
        setMostrarErrores(true);
        if (Object.keys(erroresEstado).length || !hayCambios) return;

        setGuardandoEstado(true);
        try {
            const { data } = await apiQuery.patch(`/proyectos/${id}`, cambios, { mensajeError: 'No se pudo guardar el avance.' });
            setGuardado(estadoDesdeApi(data));
            setEstado(estadoDesdeApi(data));
            setMostrarErrores(false);
            alertas.exito('Guardaste el avance del proyecto.');
        } catch {
            // apiQuery ya mostró la alerta
        } finally {
            setGuardandoEstado(false);
        }
    };

    // Devuelven true si salió bien (el formulario decide si limpiarse o cerrarse)
    const crearLogro = async (datos) => {
        try {
            const { data } = await apiQuery.post(`/proyectos/${id}/logros`, datos, { mensajeError: 'No se pudo agregar el logro.' });
            setLogros((lista) => ordenarPorFecha([data, ...lista]));
            alertas.exito(`Agregaste el logro "${data.titulo}".`);
            return true;
        } catch {
            return false;
        }
    };

    const actualizarLogro = async (idLogro, datos) => {
        try {
            const { data } = await apiQuery.put(`/proyectos/${id}/logros/${idLogro}`, datos, { mensajeError: 'No se pudo guardar el logro.' });
            setLogros((lista) => lista.map((l) => (l.id === idLogro ? { ...l, ...data } : l)));
            setEditando(null);
            alertas.exito('Guardaste los cambios del logro.');
            return true;
        } catch {
            return false;
        }
    };

    const eliminarLogro = async () => {
        setEliminando(true);
        try {
            await apiQuery.delete(`/proyectos/${id}/logros/${aEliminar.id}`, { mensajeError: 'No se pudo eliminar el logro.' });
            setLogros((lista) => lista.filter((l) => l.id !== aEliminar.id));
            alertas.exito(`Eliminaste el logro "${aEliminar.titulo}".`);
            setAEliminar(null);
        } catch {
            // apiQuery ya mostró la alerta
        } finally {
            setEliminando(false);
        }
    };

    if (!id || error) {
        return (
            <Card role="alert" className="items-start">
                <p className="m-0">{error ?? 'No se indicó de qué proyecto ver el avance.'}</p>
                <div className="flex flex-wrap gap-2">
                    {error && <Button onClick={() => { setError(null); setIntento((n) => n + 1); }}>Reintentar</Button>}
                    <Link href="/colectivo/misProyectos" className={estiloLink}>Volver a mis proyectos</Link>
                </div>
            </Card>
        );
    }

    if (!proyecto) {
        return (
            <section aria-busy="true" aria-label="Cargando avance del proyecto" className="flex flex-col gap-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-[220px] rounded-[14px]" />
                <Skeleton className="h-[260px] rounded-[14px]" />
            </section>
        );
    }

    return (
        <section aria-labelledby="titulo-avance" className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <Link href="/colectivo/misProyectos" className="text-[13px] text-muted underline">← Mis proyectos</Link>
                <h1 id="titulo-avance" className="m-0">Avance de {proyecto.titulo}</h1>
                <p className="m-0 text-muted">
                    Mantené actualizado el progreso: es lo que ven las personas colaboradoras en la página del proyecto.
                </p>
                {soloLectura && (
                    <p role="status" className="m-0 rounded-[10px] bg-sf px-3 py-2 text-[14px]">
                        Este proyecto está finalizado: podés ver su avance, pero ya no se puede modificar.
                    </p>
                )}
            </header>

            <Card as="form" onSubmit={guardarEstado} noValidate className="gap-4" aria-labelledby="titulo-estado">
                <h2 id="titulo-estado" className="m-0 font-sans text-[19px] font-bold">Estado del proyecto</h2>

                <div className="flex flex-col gap-2">
                    <div className="grid items-end gap-3 sm:grid-cols-[1fr_140px]">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="rango-avance" className="text-[13px] text-muted">Porcentaje de concreción</label>
                            <input
                                id="rango-avance"
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={Number(estado.porcentajeFinalizado) || 0}
                                disabled={soloLectura}
                                onChange={(e) => setEstado((s) => ({ ...s, porcentajeFinalizado: e.target.value }))}
                                className="h-10 w-full accent-accent"
                                aria-valuetext={`${estado.porcentajeFinalizado || 0}%`}
                            />
                        </div>
                        <Input label="Porcentaje (%)" type="number" min="0" max="100" inputMode="numeric" {...campoEstado('porcentajeFinalizado')} />
                    </div>
                    <ProgressBar value={estado.porcentajeFinalizado} label={`${Number(estado.porcentajeFinalizado) || 0}% completado`} />
                </div>

                <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                    <Input label="Repositorio público (código fuente)" type="url" placeholder="https://github.com/…" {...campoEstado('enlaceCodigoFuente')} />
                    <Input label="Sistema en producción" type="url" placeholder="https://…" {...campoEstado('enlaceSistema')} />
                </div>

                {!soloLectura && (
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button onClick={() => { setEstado(guardado); setMostrarErrores(false); }} disabled={!hayCambios || guardandoEstado}>
                            Descartar cambios
                        </Button>
                        <Button type="submit" variant="primary" cargando={guardandoEstado} disabled={!hayCambios}>
                            Guardar avance
                        </Button>
                    </div>
                )}
            </Card>

            <section aria-labelledby="titulo-logros" className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h2 id="titulo-logros" className="m-0 font-sans text-[19px] font-bold">Logros e hitos ({logros.length})</h2>
                    <p className="m-0 text-muted">Registrá cada hito alcanzado. Se muestran del más reciente al más antiguo.</p>
                </div>

                {!soloLectura && (
                    <Card className="gap-3">
                        <h3 className="m-0 font-sans text-[16px] font-bold">Nuevo logro</h3>
                        <FormularioLogro textoEnviar="Agregar logro" onEnviar={crearLogro} />
                    </Card>
                )}

                {logros.length === 0 ? (
                    <Card className="items-center py-6 text-center">
                        <p className="m-0 text-muted">Todavía no cargaste logros para este proyecto.</p>
                    </Card>
                ) : (
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                        {logros.map((logro) => (
                            <Card as="li" key={logro.id} className="gap-2">
                                {editando === logro.id ? (
                                    <FormularioLogro
                                        inicial={{ titulo: logro.titulo, descripcion: logro.descripcion }}
                                        textoEnviar="Guardar logro"
                                        onEnviar={(datos) => actualizarLogro(logro.id, datos)}
                                        onCancelar={() => setEditando(null)}
                                    />
                                ) : (
                                    <>
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="flex min-w-0 flex-col gap-0.5">
                                                <h3 className="m-0 font-sans text-[16px] font-bold">{logro.titulo}</h3>
                                                {logro.fecha && (
                                                    <span className="text-[13px] text-muted">Cargado el {formatearFecha(logro.fecha)}</span>
                                                )}
                                            </div>
                                            {!soloLectura && (
                                                <div className="flex gap-2">
                                                    <Button onClick={() => setEditando(logro.id)}>
                                                        Editar<span className="sr-only"> logro {logro.titulo}</span>
                                                    </Button>
                                                    <Button variant="danger" onClick={() => setAEliminar(logro)}>
                                                        Eliminar<span className="sr-only"> logro {logro.titulo}</span>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="m-0 whitespace-pre-line text-muted">{logro.descripcion}</p>
                                    </>
                                )}
                            </Card>
                        ))}
                    </ul>
                )}
            </section>

            <Modal
                open={aEliminar !== null}
                onClose={() => !eliminando && setAEliminar(null)}
                title={`¿Eliminar el logro "${aEliminar?.titulo}"?`}
                footer={
                    <>
                        <Button onClick={() => setAEliminar(null)} disabled={eliminando}>Cancelar</Button>
                        <Button variant="danger" onClick={eliminarLogro} cargando={eliminando}>Eliminar logro</Button>
                    </>
                }
            >
                <p className="m-0 text-muted">Se elimina de forma permanente y deja de verse en la página del proyecto.</p>
            </Modal>
        </section>
    );
}
