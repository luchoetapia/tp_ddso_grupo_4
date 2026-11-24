"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, Skeleton, Tag } from "@/components/common";
import { formatearFechaHora } from "@/helpers/formatos";

const mensajeDeError = (e) => {
    if (e.response?.status === 401) return "Iniciá sesión para ver tus mensajes.";
    return e.response?.data?.message ?? "No se pudieron cargar los mensajes.";
};

// Mensajes internos de cualquier usuario logueado: contactos de colectivos, avisos automáticos y de moderación
export default function MensajesInternos() {
    const [mensajes, setMensajes] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios
            .get("/api/notificaciones/me")
            .then(({ data }) => setMensajes(data))
            .catch((e) => {
                setError(mensajeDeError(e));
                setMensajes([]);
            });
    }, []);

    const cargando = mensajes === null;

    return (
        <section className="flex flex-col gap-4">
            <h1>Mensajes internos</h1>

            {error && (
                <p role="alert" className="text-error">
                    {error}
                </p>
            )}

            <div aria-busy={cargando}>
                {cargando && (
                    <div className="flex flex-col gap-3">
                        <Skeleton />
                        <Skeleton />
                    </div>
                )}

                {!cargando && !error && mensajes.length === 0 && (
                    <p className="text-muted">Todavía no recibiste mensajes.</p>
                )}

                {!cargando && mensajes.length > 0 && (
                    <ul className="flex flex-col gap-3">
                        {mensajes.map((m) => (
                            <Card as="li" key={m.id}>
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <Tag variant={m.automatica ? "neutral" : "accent"}>
                                        {m.automatica ? "Aviso de la plataforma" : "Contacto"}
                                    </Tag>
                                    <time dateTime={m.fecha} className="text-[13px] text-muted">
                                        {formatearFechaHora(m.fecha)}
                                    </time>
                                </div>
                                <p className="whitespace-pre-line">{m.mensaje}</p>
                            </Card>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
