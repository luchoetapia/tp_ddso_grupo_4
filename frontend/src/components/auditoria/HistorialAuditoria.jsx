"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Paginacion, Select, Skeleton, Tag } from "@/components/common";
import apiQuery from "@/services/api/apiQuery";
import { formatearFechaHora } from "@/helpers/formatos";
import { TEXTO_ACCION, TIPOS_ENTIDAD, textoAccion, textoAutor } from "@/helpers/auditoria";

const LIMITE = 20;
const FILTROS_VACIOS = { accion: "", tipoEntidad: "", idColectivo: "", desde: "", hasta: "" };

const textoTipo = Object.fromEntries(TIPOS_ENTIDAD.map(({ valor, texto }) => [valor, texto]));
const ACCIONES = Object.entries(TEXTO_ACCION).sort(([, a], [, b]) => a.localeCompare(b, "es"));

// Solo los filtros cargados (la API rechaza parámetros vacíos)
const paramsDe = (filtros, pagina) => ({
    pagina,
    limite: LIMITE,
    ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)),
});

// Historial de auditoría paginado y filtrable.
// url: endpoint (/colectivos/me/auditoria o /auditoria).
// global: además filtra por acción y por organización, y muestra la organización de cada registro.
export default function HistorialAuditoria({ url, global = false }) {
    const [filtros, setFiltros] = useState(FILTROS_VACIOS);
    const [aplicados, setAplicados] = useState(FILTROS_VACIOS);
    const [pagina, setPagina] = useState(1);
    // Última respuesta y la consulta a la que corresponde: si no coincide con la actual, está cargando
    const [respuesta, setRespuesta] = useState({ consulta: null, resultado: null, error: null });
    const [colectivos, setColectivos] = useState([]);

    const consulta = JSON.stringify(paramsDe(aplicados, pagina));
    const cargando = respuesta.consulta !== consulta;
    const { resultado, error } = respuesta;

    useEffect(() => {
        const controlador = new AbortController();
        apiQuery
            .get(url, {
                signal: controlador.signal,
                params: JSON.parse(consulta),
                alertarError: false,
                mensajeError: "No se pudo cargar el historial de actividad.",
            })
            .then((datos) => setRespuesta({ consulta, resultado: datos, error: null }))
            .catch((e) => {
                if (!e.cancelado) setRespuesta((anterior) => ({ ...anterior, consulta, error: e.mensaje }));
            });
        return () => controlador.abort();
    }, [url, consulta]);

    // Organizaciones para el filtro y para mostrar el nombre en cada registro
    useEffect(() => {
        if (!global) return;
        const controlador = new AbortController();
        apiQuery
            .get("/colectivos", {
                signal: controlador.signal,
                params: { limite: 100, orden: "nombre" },
                alertarError: false,
            })
            .then(({ data }) => setColectivos(data))
            .catch(() => {
                // Sin la lista se puede seguir usando el historial (solo falta ese filtro)
            });
        return () => controlador.abort();
    }, [global]);

    const nombreColectivo = Object.fromEntries(colectivos.map(({ id, nombre }) => [id, nombre]));
    const rangoInvalido = filtros.desde && filtros.hasta && filtros.desde > filtros.hasta;

    const filtrar = (e) => {
        e.preventDefault();
        if (rangoInvalido) return;
        setPagina(1);
        setAplicados(filtros);
    };

    const limpiar = () => {
        setFiltros(FILTROS_VACIOS);
        setPagina(1);
        setAplicados(FILTROS_VACIOS);
    };

    const actualizarFiltro = (campo, valor) => setFiltros((anteriores) => ({ ...anteriores, [campo]: valor }));

    return (
        <div className="flex flex-col gap-6">
            <Card as="form" onSubmit={filtrar} className="gap-4" aria-label="Filtrar actividad">
                <div className={`grid gap-3 sm:grid-cols-2 ${global ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
                    {global && (
                        <Select label="Organización" value={filtros.idColectivo} onChange={(e) => actualizarFiltro("idColectivo", e.target.value)}>
                            <option value="">Todas</option>
                            {colectivos.map(({ id, nombre }) => (
                                <option key={id} value={id}>
                                    {nombre}
                                </option>
                            ))}
                        </Select>
                    )}
                    <Select label="Sobre" value={filtros.tipoEntidad} onChange={(e) => actualizarFiltro("tipoEntidad", e.target.value)}>
                        <option value="">Todo</option>
                        {TIPOS_ENTIDAD.map(({ valor, texto }) => (
                            <option key={valor} value={valor}>
                                {texto}
                            </option>
                        ))}
                    </Select>
                    {global && (
                        <Select label="Acción" value={filtros.accion} onChange={(e) => actualizarFiltro("accion", e.target.value)}>
                            <option value="">Todas</option>
                            {ACCIONES.map(([valor, texto]) => (
                                <option key={valor} value={valor}>
                                    {texto}
                                </option>
                            ))}
                        </Select>
                    )}
                    <Input label="Desde" type="date" value={filtros.desde} onChange={(e) => actualizarFiltro("desde", e.target.value)} />
                    <Input
                        label="Hasta"
                        type="date"
                        value={filtros.hasta}
                        onChange={(e) => actualizarFiltro("hasta", e.target.value)}
                        error={rangoInvalido ? "Tiene que ser igual o posterior a 'Desde'." : undefined}
                    />
                </div>
                <div className="flex flex-wrap justify-end gap-3">
                    <Button onClick={limpiar}>Limpiar filtros</Button>
                    <Button type="submit" variant="primary" disabled={rangoInvalido}>
                        Filtrar
                    </Button>
                </div>
            </Card>

            {error && !cargando ? (
                <p role="alert" className="text-error">
                    {error}
                </p>
            ) : cargando && !resultado ? (
                <div aria-busy="true" aria-label="Cargando actividad" className="flex flex-col gap-3">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                </div>
            ) : resultado.data.length === 0 ? (
                <Card className="items-center text-center">
                    <p className="text-muted">No hay actividad registrada con esos filtros.</p>
                </Card>
            ) : (
                <div aria-busy={cargando} className={`flex flex-col gap-4 ${cargando ? "opacity-60" : ""}`}>
                    <ol className="flex list-none flex-col gap-3 p-0" aria-label="Actividad">
                        {resultado.data.map((registro) => (
                            <Card as="li" key={registro.id} className="gap-1.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold">{textoAccion(registro.accion)}</span>
                                    <span className="flex flex-wrap gap-1.5">
                                        {global && registro.idColectivo && (
                                            <Tag variant="accent">{nombreColectivo[registro.idColectivo] ?? "Organización"}</Tag>
                                        )}
                                        <Tag variant="neutral">{textoTipo[registro.entidad.tipo] ?? registro.entidad.tipo}</Tag>
                                    </span>
                                </div>
                                {registro.detalle && <p className="m-0 break-words text-sm">{registro.detalle}</p>}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                                    <time dateTime={registro.fecha}>{formatearFechaHora(registro.fecha)}</time>
                                    <span>Por: {textoAutor(registro.autor)}</span>
                                    {registro.entidad.tipo === "Proyecto" && (
                                        <Link href={`/proyectos/ver?id=${registro.entidad.id}`} className="font-semibold text-accent underline">
                                            Ver proyecto
                                        </Link>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </ol>
                    <Paginacion {...resultado.paginacion} onCambiar={setPagina} nombre="registros" />
                </div>
            )}
        </div>
    );
}
