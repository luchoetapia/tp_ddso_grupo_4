"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Tag } from "@/components/common";
import apiQuery from "@/services/api/apiQuery";
import { formatearFecha } from "@/helpers/formatos";
import { TEXTO_REGLA } from "@/helpers/moderacion";

const DONDE_CORREGIR = {
    Proyecto: (id) => ({ href: `/colectivo/misProyectos/editar?id=${id}`, texto: "Editar proyecto" }),
    Colectivo: () => ({ href: "/colectivo/perfil", texto: "Editar datos de la organización" }),
    Colaborador: () => ({ href: "/colaboradoras/miPerfil", texto: "Editar mi perfil" }),
    Postulacion: () => ({ href: "/colaboradoras/misPostulaciones", texto: "Ver mis postulaciones" }),
};

const QUE_ES = { Proyecto: "Proyecto", Colectivo: "Organización", Colaborador: "Tu perfil", Postulacion: "Postulación" };

export default function AvisosModeracion({ url }) {
    const [avisos, setAvisos] = useState([]);

    useEffect(() => {
        const controlador = new AbortController();
        apiQuery
            .get(url, { signal: controlador.signal, alertarError: false })
            .then(setAvisos)
            .catch(() => {
                // Si no se pueden cargar, el inicio se muestra igual
            });
        return () => controlador.abort();
    }, [url]);

    if (avisos.length === 0) return null;

    return (
        <Card as="section" aria-labelledby="titulo-avisos-moderacion" className="gap-3 border-error/50">
            <div className="flex flex-col gap-1">
                <h2 id="titulo-avisos-moderacion" className="m-0 text-lg font-bold text-error">
                    {avisos.length === 1 ? "Tenés algo para corregir" : `Tenés ${avisos.length} cosas para corregir`}
                </h2>
                <p className="m-0 text-sm text-muted">
                    El equipo de moderación detectó contenido que podría no cumplir las reglas de la plataforma. Corregilo
                    para que el aviso desaparezca; si no, puede darse de baja.
                </p>
            </div>

            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {avisos.map((aviso) => {
                    const corregir = DONDE_CORREGIR[aviso.entidad.tipo]?.(aviso.entidad.id);
                    return (
                        <li key={aviso.id} className="flex flex-col gap-1.5 rounded-[10px] bg-sf/60 p-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold">
                                    {QUE_ES[aviso.entidad.tipo] ?? aviso.entidad.tipo}
                                    {aviso.nombreEntidad && aviso.entidad.tipo !== "Colaborador" ? `: ${aviso.nombreEntidad}` : ""}
                                </span>
                                {aviso.reglas.map((regla) => (
                                    <Tag key={regla} variant="error">{TEXTO_REGLA[regla] ?? regla}</Tag>
                                ))}
                            </div>
                            <p className="m-0 break-words text-sm">{aviso.motivo}</p>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                                <span>Aviso del {formatearFecha(aviso.fechaNotificacion)}</span>
                                {corregir && (
                                    <Link href={corregir.href} className="font-semibold text-accent underline">
                                        {corregir.texto}
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </Card>
    );
}
