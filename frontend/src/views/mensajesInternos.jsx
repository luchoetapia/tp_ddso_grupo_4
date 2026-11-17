"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button, Card, Skeleton, Tag } from "@/components/common";
import apiQuery from "@/services/api/apiQuery";
import alertas from "@/services/alertas";
import { formatearFechaHora } from "@/helpers/formatos";

const mensajeDeError = (e) => {
    if (e.response?.status === 401) return "Iniciá sesión para ver tus mensajes.";
    return e.response?.data?.message ?? "No se pudieron cargar los mensajes.";
};

const clavePostulacion = (idProyecto, idPerfil) => `${idProyecto}-${idPerfil}`;

const varianteEstado = { Pendiente: "highlight", Aceptada: "accent", Rechazada: "neutral" };

export default function MensajesInternos() {
    const [mensajes, setMensajes] = useState(null); 
    const [error, setError] = useState(null);

    useEffect(() => {
        axios
            .get("/api/colaboradores/me/notificaciones")
            .then(({ data }) => setMensajes(data))
            .catch((e) => {
                setError(mensajeDeError(e));
                setMensajes([]);
            });
    }, []);

    // Colaboradora logueada y sus postulaciones, para saber a qué perfiles ya se postuló
    const [colaboradora, setColaboradora] = useState(null);
    const [postulaciones, setPostulaciones] = useState({});
    const [postulandoA, setPostulandoA] = useState(null);

    useEffect(() => {
        const cargar = async () => {
            try {
                const yo = await apiQuery.get("/colaboradores/me", { alertarError: false });
                setColaboradora(yo);
                const propias = await apiQuery.get("/postulaciones", { params: { idColaborador: yo.id }, alertarError: false });
                // Si hay varias para el mismo perfil (p. ej. una rechazada y otra nueva), queda la más reciente
                const porPerfil = {};
                [...propias]
                    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                    .forEach((p) => { porPerfil[clavePostulacion(p.proyecto.id, p.idPerfil)] = p.estado; });
                setPostulaciones(porPerfil);
            } catch {
                // Sin esto igual se ven los mensajes; solo no se puede postular
            }
        };
        cargar();
    }, []);

    const postularse = async (m) => {
        const clave = clavePostulacion(m.proyecto.id, m.perfil.id);
        setPostulandoA(clave);
        try {
            const { data } = await apiQuery.post(
                "/postulaciones",
                { idProyecto: m.proyecto.id, idPerfil: m.perfil.id, cuentaGit: colaboradora.cuentaGit },
                { mensajeError: "No se pudo enviar la postulación." }
            );
            setPostulaciones((actuales) => ({ ...actuales, [clave]: data.estado }));
            alertas.exito(`Te postulaste a ${m.proyecto.titulo}.`);
        } catch {
            // apiQuery ya mostró la alerta con el motivo (p. ej. búsqueda cerrada)
        } finally {
            setPostulandoA(null);
        }
    };

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
                                    <h2 className="font-sans text-base">{m.proyecto.titulo}</h2>
                                    <time dateTime={m.fecha} className="text-[13px] text-muted">
                                        {formatearFechaHora(m.fecha)}
                                    </time>
                                </div>
                                <p>{m.mensaje}</p>
                                <p className="text-[13px] text-muted">Perfil: {m.perfil.descripcion}</p>
                                {colaboradora && (() => {
                                    const clave = clavePostulacion(m.proyecto.id, m.perfil.id);
                                    const estado = postulaciones[clave];
                                    if (estado && estado !== "Rechazada") {
                                        return (
                                            <div>
                                                <Tag variant={varianteEstado[estado]}>Postulación {estado.toLowerCase()}</Tag>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Button variant="primary" cargando={postulandoA === clave} onClick={() => postularse(m)}>
                                                Postularme
                                            </Button>
                                            {estado === "Rechazada" && (
                                                <span className="text-[13px] text-muted">Tu postulación anterior fue rechazada.</span>
                                            )}
                                        </div>
                                    );
                                })()}
                            </Card>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}