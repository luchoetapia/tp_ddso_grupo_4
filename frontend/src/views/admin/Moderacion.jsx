"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Modal, Paginacion, Select, Skeleton, Tag, Textarea } from "@/components/common";
import apiQuery from "@/services/api/apiQuery";
import alertas from "@/services/alertas";
import { formatearFecha, formatearFechaHora } from "@/helpers/formatos";
import { ESTADO, ESTADOS_REPORTE, EVENTO_MODERACION_ACTUALIZADA, TEXTO_REGLA, TIPO, TIPOS_REPORTADOS } from "@/helpers/moderacion";

const LIMITE = 10;
const FILTROS_INICIALES = { estado: "Pendiente", tipoEntidad: "" };

// Acciones de revisión manual sobre un reporte pendiente
const ACCIONES = {
    notificar: {
        titulo: "¿Pedir que corrijan el contenido?",
        explicacion:
            "Al dueño le llega un email y ve un aviso al entrar a la plataforma con lo que tiene que corregir. El reporte queda pendiente: si edita el contenido y ya no incumple las reglas, se da por solucionado solo.",
        boton: "Avisar al dueño",
        variante: "primary",
        exito: "Se le avisó al dueño para que corrija el contenido.",
        conComentario: false,
    },
    validar: {
        titulo: "¿Dar de baja el contenido?",
        explicacion: "Se va a eliminar la entidad reportada de la plataforma. Esta acción es permanente y no se puede deshacer.",
        boton: "Sí, dar de baja",
        variante: "danger",
        exito: "El contenido se dio de baja.",
        conComentario: true,
    },
    rechazar: {
        titulo: "¿Desestimar el reporte?",
        explicacion: "El contenido es válido en su contexto (falso positivo). El reporte se cierra sin cambios.",
        boton: "Desestimar",
        variante: "primary",
        exito: "El reporte se desestimó.",
        conComentario: true,
    },
};

const paramsDe = (filtros, pagina) => ({
    pagina,
    limite: LIMITE,
    ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)),
});

const enlaceEntidad = ({ tipo, id }) => (tipo === "Proyecto" ? `/proyectos/ver?id=${id}` : null);

// Textos actuales de la entidad reportada (GET /reportes/:id)
function ContenidoReportado({ idReporte }) {
    const [estado, setEstado] = useState({ contenido: undefined, error: null });

    useEffect(() => {
        const controlador = new AbortController();
        apiQuery
            .get(`/reportes/${idReporte}`, { signal: controlador.signal, alertarError: false, mensajeError: "No se pudo cargar el contenido." })
            .then(({ contenido }) => setEstado({ contenido, error: null }))
            .catch((e) => {
                if (!e.cancelado) setEstado({ contenido: undefined, error: e.mensaje });
            });
        return () => controlador.abort();
    }, [idReporte]);

    if (estado.error) return <p role="alert" className="m-0 text-sm text-error">{estado.error}</p>;
    if (estado.contenido === undefined) return <Skeleton className="h-16" />;
    if (estado.contenido === null) return <p className="m-0 text-sm text-muted">La entidad ya no existe en la plataforma.</p>;

    const campos = Object.entries(estado.contenido).filter(([, valor]) => valor);
    return (
        <dl className="m-0 grid gap-x-3 gap-y-1.5 rounded-[10px] bg-sf/60 p-3 text-sm sm:grid-cols-[180px_1fr]">
            {campos.map(([campo, valor]) => (
                <div key={campo} className="contents">
                    <dt className="font-semibold text-muted">{campo}</dt>
                    <dd className="m-0 whitespace-pre-line break-words">{valor}</dd>
                </div>
            ))}
        </dl>
    );
}

function TarjetaReporte({ reporte, onAccion }) {
    const [verContenido, setVerContenido] = useState(false);
    const pendiente = reporte.estado === "Pendiente";
    const enlace = enlaceEntidad(reporte.entidad);

    return (
        <Card as="li" className="gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <Tag variant="neutral">{TIPO[reporte.entidad.tipo]?.texto ?? reporte.entidad.tipo}</Tag>
                    {reporte.reglas.map((regla) => (
                        <Tag key={regla} variant="error">{TEXTO_REGLA[regla] ?? regla}</Tag>
                    ))}
                    {pendiente && reporte.notificado && (
                        <Tag variant="accent">Corrección pedida el {formatearFecha(reporte.fechaNotificacion)}</Tag>
                    )}
                    {pendiente && reporte.fechaUltimoCambio && (
                        <Tag variant="highlight">Editado por el dueño el {formatearFechaHora(reporte.fechaUltimoCambio)}, sigue incumpliendo</Tag>
                    )}
                </div>
                <Tag variant={ESTADO[reporte.estado]?.variante ?? "neutral"}>{reporte.estado}</Tag>
            </div>

            <p className="m-0 break-words">{reporte.motivo}</p>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                <time dateTime={reporte.fechaCreacion}>Detectado el {formatearFechaHora(reporte.fechaCreacion)}</time>
                {reporte.duenio && <span>Dueño: {reporte.duenio.username} ({reporte.duenio.email})</span>}
                {enlace && (
                    <Link href={enlace} className="font-semibold text-accent underline">
                        Ver {TIPO[reporte.entidad.tipo]?.texto.toLowerCase()}
                    </Link>
                )}
            </div>

            {reporte.estado === "Solucionado" && (
                <p className="m-0 text-sm text-muted">
                    El dueño lo corrigió el {formatearFechaHora(reporte.fechaSolucion)} y ya cumple las reglas: se cerró solo.
                </p>
            )}

            {!pendiente && reporte.revisadoPor && (
                <p className="m-0 text-sm text-muted">
                    Revisado por {reporte.revisadoPor.username} el {formatearFechaHora(reporte.fechaRevision)}
                    {reporte.comentarioRevision && <>: “{reporte.comentarioRevision}”</>}
                </p>
            )}

            <Button
                variant="link"
                onClick={() => setVerContenido((v) => !v)}
                aria-expanded={verContenido}
                className="self-start px-0 text-accent underline"
            >
                {verContenido ? "Ocultar contenido" : "Ver contenido actual"}
            </Button>
            {verContenido && <ContenidoReportado idReporte={reporte.id} />}

            {pendiente && (
                <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button onClick={() => onAccion(reporte, "rechazar")}>Desestimar</Button>
                    <Button onClick={() => onAccion(reporte, "notificar")}>
                        {reporte.notificado ? "Reenviar aviso" : "Pedir corrección"}
                    </Button>
                    <Button variant="danger" onClick={() => onAccion(reporte, "validar")}>
                        Dar de baja
                    </Button>
                </div>
            )}
        </Card>
    );
}

export default function Moderacion() {
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    const [pagina, setPagina] = useState(1);
    const [recarga, setRecarga] = useState(0);
    // Última respuesta y la consulta a la que corresponde: si no coincide con la actual, está cargando
    const [respuesta, setRespuesta] = useState({ consulta: null, resultado: null, error: null });

    const [accion, setAccion] = useState(null); // { reporte, tipo }
    const [comentario, setComentario] = useState("");
    const [procesando, setProcesando] = useState(false);

    const consulta = JSON.stringify({ ...paramsDe(filtros, pagina), recarga });
    const cargando = respuesta.consulta !== consulta;
    const { resultado, error } = respuesta;

    useEffect(() => {
        const controlador = new AbortController();
        const { recarga: _recarga, ...params } = JSON.parse(consulta);
        apiQuery
            .get("/reportes", {
                signal: controlador.signal,
                params,
                alertarError: false,
                mensajeError: "No se pudieron cargar los reportes.",
            })
            .then((datos) => setRespuesta({ consulta, resultado: datos, error: null }))
            .catch((e) => {
                if (!e.cancelado) setRespuesta((anterior) => ({ ...anterior, consulta, error: e.mensaje }));
            });
        return () => controlador.abort();
    }, [consulta]);

    const cambiarFiltro = (campo, valor) => {
        setFiltros((anteriores) => ({ ...anteriores, [campo]: valor }));
        setPagina(1);
    };

    const abrirAccion = (reporte, tipo) => {
        setComentario("");
        setAccion({ reporte, tipo });
    };

    const confirmarAccion = async () => {
        const { reporte, tipo } = accion;
        const config = ACCIONES[tipo];
        setProcesando(true);
        try {
            const body = config.conComentario && comentario.trim() ? { comentario: comentario.trim() } : {};
            await apiQuery.patch(`/reportes/${reporte.id}/${tipo}`, body, { mensajeError: "No se pudo resolver el reporte." });
            alertas.exito(config.exito);
            setAccion(null);
            setRecarga((n) => n + 1);
            window.dispatchEvent(new Event(EVENTO_MODERACION_ACTUALIZADA));
        } catch {
            // apiQuery ya mostró la alerta (p. ej. otro admin ya lo resolvió)
            setRecarga((n) => n + 1);
        } finally {
            setProcesando(false);
        }
    };

    const config = accion ? ACCIONES[accion.tipo] : null;

    return (
        <section className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1>Moderación</h1>
                <p className="text-muted">
                    Proyectos, organizaciones y perfiles que la plataforma marcó automáticamente por posible incumplimiento de
                    las reglas (contenido inapropiado, fin de lucro, código no público). Revisalos y decidí qué hacer.
                </p>
            </header>

            <Card className="grid gap-3 sm:grid-cols-2" aria-label="Filtrar reportes">
                <Select label="Estado" value={filtros.estado} onChange={(e) => cambiarFiltro("estado", e.target.value)}>
                    {ESTADOS_REPORTE.map(({ valor, texto }) => (
                        <option key={valor} value={valor}>
                            {texto}
                        </option>
                    ))}
                    <option value="">Todos</option>
                </Select>
                <Select label="Sobre" value={filtros.tipoEntidad} onChange={(e) => cambiarFiltro("tipoEntidad", e.target.value)}>
                    <option value="">Todo</option>
                    {TIPOS_REPORTADOS.map(({ valor, texto }) => (
                        <option key={valor} value={valor}>
                            {texto}
                        </option>
                    ))}
                </Select>
            </Card>

            {error && !cargando ? (
                <p role="alert" className="text-error">
                    {error}
                </p>
            ) : cargando && !resultado ? (
                <div aria-busy="true" aria-label="Cargando reportes" className="flex flex-col gap-3">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                </div>
            ) : resultado.data.length === 0 ? (
                <Card className="items-center text-center">
                    <p className="m-0 text-muted">
                        {filtros.estado === "Pendiente" ? "No hay reportes pendientes. ¡Todo en orden!" : "No hay reportes con esos filtros."}
                    </p>
                </Card>
            ) : (
                <div aria-busy={cargando} className={`flex flex-col gap-4 ${cargando ? "opacity-60" : ""}`}>
                    <ul className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Reportes">
                        {resultado.data.map((reporte) => (
                            <TarjetaReporte key={reporte.id} reporte={reporte} onAccion={abrirAccion} />
                        ))}
                    </ul>
                    <Paginacion {...resultado.paginacion} onCambiar={setPagina} nombre="reportes" />
                </div>
            )}

            <Modal
                open={!!accion}
                onClose={() => !procesando && setAccion(null)}
                title={config?.titulo}
                footer={
                    <>
                        <Button onClick={() => setAccion(null)} disabled={procesando}>
                            Cancelar
                        </Button>
                        <Button variant={config?.variante} onClick={confirmarAccion} cargando={procesando}>
                            {config?.boton}
                        </Button>
                    </>
                }
            >
                <p className="m-0 text-sm">{config?.explicacion}</p>
                {config?.conComentario && (
                    <Textarea
                        label="Comentario (opcional)"
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        maxLength={500}
                        rows={3}
                    />
                )}
            </Modal>
        </section>
    );
}
