"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiQuery from "@/services/api/apiQuery";
import alertas from "@/services/alertas";
import sesion from "@/services/sesion";
import useRetornoLinkedin from "@/hooks/useRetornoLinkedin";
import CardLinkedin from "@/components/linkedin/CardLinkedin";
import { Button, Card, Modal, Skeleton, Tag } from "@/components/common";

export default function DatosPersonales() {
    const router = useRouter();
    const [perfil, setPerfil] = useState(null);
    const [error, setError] = useState(null);
    const [confirmar, setConfirmar] = useState(false);
    const [eliminando, setEliminando] = useState(false);
    // undefined: cargando · null: sin LinkedIn
    const [linkedin, setLinkedin] = useState(undefined);

    // Avisa el resultado al volver de conectar LinkedIn
    useRetornoLinkedin();

    useEffect(() => {
        sesion.obtenerUsuario().then((usuario) => setLinkedin(usuario?.linkedin ?? null));
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        apiQuery.get("/colaboradores/me", {
            signal: controller.signal,
            alertarError: false,
        }).then(setPerfil).catch((e) => {
            if (!e.cancelado) setError("No se pudieron cargar tus datos personales.");
        });
        return () => controller.abort();
    }, []);

    const eliminarCuenta = async () => {
        setEliminando(true);
        try {
            await apiQuery.delete("/colaboradores/me", {
                mensajeError: "No se pudo eliminar la cuenta.",
            });
            alertas.exito("Tu cuenta fue eliminada.");
            router.replace("/");
            router.refresh();
        } catch {
            // apiQuery ya muestra la alerta
        } finally {
            setEliminando(false);
            setConfirmar(false);
        }
    };

    if (error) return <p role="alert" className="text-error">{error}</p>;
    if (!perfil) {
        return (
            <section aria-busy="true" className="flex flex-col gap-3">
                <Skeleton />
                <Skeleton />
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-4">
            <h1>Datos personales</h1>
            <Card>
                <p>Cuenta de Git: {perfil.cuentaGit}</p>
                <p>Nombre: {[perfil.nombre, perfil.apellido].filter(Boolean).join(" ") || "—"}</p>
                <p>Pronombres: {perfil.pronombres || "—"}</p>
                <p>Presentación: {perfil.presentacion || "—"}</p>
                <div className="flex flex-wrap gap-2">
                    {perfil.habilidades.map((h) => <Tag key={h.id}>{h.titulo}</Tag>)}
                </div>
            </Card>

            {linkedin !== undefined && <CardLinkedin linkedin={linkedin} para="los proyectos en los que colaborás" />}

            <Card className="items-start">
                <h2 className="m-0 font-sans text-base">Eliminar cuenta</h2>
                <p className="m-0 text-muted">
                    Tu información personal pública será anonimizada. Tus habilidades y el historial de proyectos
                    y colaboraciones se conservarán.
                </p>
                <Button variant="danger" onClick={() => setConfirmar(true)}>
                    Eliminar mi cuenta
                </Button>
            </Card>

            <Modal
                open={confirmar}
                onClose={() => !eliminando && setConfirmar(false)}
                title="¿Eliminar tu cuenta?"
                footer={
                    <>
                        <Button onClick={() => setConfirmar(false)} disabled={eliminando}>Cancelar</Button>
                        <Button variant="danger" onClick={eliminarCuenta} cargando={eliminando}>
                            Eliminar cuenta
                        </Button>
                    </>
                }
            >
                <p className="m-0">
                    La acción cierra tus colaboraciones activas y no se puede deshacer.
                </p>
            </Modal>
        </section>
    );
}