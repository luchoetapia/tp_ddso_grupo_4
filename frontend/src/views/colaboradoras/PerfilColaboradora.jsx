"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Skeleton, Tag } from "@/components/common";
import apiQuery from "@/services/api/apiQuery";

const MENSAJE_SIN_ACCESO =
    "No tenés acceso a los datos de contacto. Solo los ve la propia colaboradora o un colectivo que le haya aceptado una postulación.";

const nombreVisible = (c) => c.nombreFantasia || [c.nombre, c.apellido].filter(Boolean).join(" ") || c.cuentaGit;

export default function PerfilColaboradora() {
    const cuentaGit = useSearchParams().get("cuentaGit");

    const [colaboradora, setColaboradora] = useState(null);
    const [errorPerfil, setErrorPerfil] = useState(null);

    const [contactos, setContactos] = useState(null);
    const [cargandoContactos, setCargandoContactos] = useState(false);
    const [errorContactos, setErrorContactos] = useState(null);

    useEffect(() => {
        if (!cuentaGit) return;
        const controlador = new AbortController();
        apiQuery
            .get(`/colaboradores/${encodeURIComponent(cuentaGit)}`, {
                signal: controlador.signal,
                alertarError: false,
                mensajeError: "No se pudo cargar el perfil.",
            })
            .then(setColaboradora)
            .catch((e) => {
                if (!e.cancelado) setErrorPerfil(e.mensaje);
            });
        return () => controlador.abort();
    }, [cuentaGit]);

    const verContactos = async () => {
        setCargandoContactos(true);
        setErrorContactos(null);
        try {
            const data = await apiQuery.get(`/colaboradores/${encodeURIComponent(cuentaGit)}/contactos`, {
                alertarError: false,
                mensajeError: "No se pudieron cargar los datos de contacto.",
            });
            setContactos(data);
        } catch (e) {
            if (e.status === 403) setErrorContactos(MENSAJE_SIN_ACCESO);
            else if (e.status === 401) setErrorContactos("Iniciá sesión para ver los datos de contacto.");
            else setErrorContactos(e.mensaje);
        } finally {
            setCargandoContactos(false);
        }
    };

    if (!cuentaGit || errorPerfil) {
        return (
            <p role="alert" className="text-error">
                {errorPerfil ?? "No se indicó qué colaboradora ver."}
            </p>
        );
    }

    if (!colaboradora) {
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
            <header className="flex flex-col gap-2">
                <h1>{nombreVisible(colaboradora)}</h1>
                <p className="text-muted">
                    @{colaboradora.cuentaGit}
                    {colaboradora.pronombres && ` · ${colaboradora.pronombres}`}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    {colaboradora.habilidades.length > 0 ? (
                        colaboradora.habilidades.map((h) => <Tag key={h.id}>{h.titulo}</Tag>)
                    ) : (
                        <p className="text-muted">Todavía no cargó habilidades.</p>
                    )}
                </div>
            </header>

            {colaboradora.presentacion && (
                <Card as="section" aria-labelledby="titulo-presentacion">
                    <h2 id="titulo-presentacion" className="font-sans text-base">
                        Presentación
                    </h2>
                    <p>{colaboradora.presentacion}</p>
                </Card>
            )}

            <Card as="section" aria-labelledby="titulo-contacto" aria-busy={cargandoContactos}>
                <h2 id="titulo-contacto" className="font-sans text-base">
                    Datos de contacto
                </h2>

                {contactos === null && (
                    <>
                        <p className="text-muted">
                            Los datos de contacto son privados. Los puede ver la propia colaboradora o un colectivo que le
                            haya aceptado una postulación.
                        </p>
                        <div>
                            <Button variant="primary" cargando={cargandoContactos} onClick={verContactos}>
                                Ver datos de contacto
                            </Button>
                        </div>
                    </>
                )}

                {errorContactos && (
                    <p role="alert" className="text-error">
                        {errorContactos}
                    </p>
                )}

                {contactos?.length === 0 && <p className="text-muted">No registró medios de contacto.</p>}

                {contactos?.length > 0 && (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                        {contactos.map((c, i) => (
                            <div key={i} className="contents">
                                <dt className="font-semibold">{c.medio}</dt>
                                <dd className="break-all">{c.valor}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </Card>
        </section>
    );
}
