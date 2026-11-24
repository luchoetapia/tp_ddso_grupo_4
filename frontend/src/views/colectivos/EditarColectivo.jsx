"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Modal, Skeleton } from "@/components/common";
import PasoDatosColectivo from "@/components/registro/PasoDatosColectivo";
import apiQuery from "@/services/api/apiQuery";
import alertas from "@/services/alertas";
import sesion from "@/services/sesion";

const CAMPOS = ["nombre", "tipo", "ubicacion", "descripcion"];

const datosEditables = (colectivo) =>
    Object.fromEntries(CAMPOS.map((campo) => [campo, colectivo[campo] ?? ""]));

const obtenerCambios = (original, editado) =>
    Object.fromEntries(CAMPOS.filter((campo) => editado[campo].trim() !== original[campo]).map((campo) => [campo, editado[campo].trim()]));

export default function EditarColectivo() {
    const [original, setOriginal] = useState(null);
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const router = useRouter();
    const [idColectivo, setIdColectivo] = useState(null);
    const [esTitular, setEsTitular] = useState(false);
    const [confirmarBaja, setConfirmarBaja] = useState(false);
    const [dandoDeBaja, setDandoDeBaja] = useState(false);

    useEffect(() => {
        const controlador = new AbortController();
        apiQuery
            .get("/colectivos/me/administradores", { signal: controlador.signal, alertarError: false })
            .then(({ puedeGestionar }) => setEsTitular(puedeGestionar))
            .catch(() => setEsTitular(false));
        return () => controlador.abort();
    }, []);

    useEffect(() => {
        const controlador = new AbortController();
        apiQuery
            .get("/colectivos/me", {
                signal: controlador.signal,
                alertarError: false,
                mensajeError: "No se pudieron cargar los datos de tu organización.",
            })
            .then((colectivo) => {
                setIdColectivo(colectivo.id);
                const editables = datosEditables(colectivo);
                setOriginal(editables);
                setDatos(editables);
            })
            .catch((e) => {
                if (!e.cancelado) setError(e.mensaje);
            });
        return () => controlador.abort();
    }, []);

    const actualizarCampo = (campo, valor) => setDatos((anterior) => ({ ...anterior, [campo]: valor }));

    const cambios = original && datos ? obtenerCambios(original, datos) : {};
    const hayCambios = Object.keys(cambios).length > 0;
    const completo = datos && datos.nombre.trim() !== "" && datos.tipo !== "" && datos.descripcion.trim() !== "";

    const guardar = async (e) => {
        e.preventDefault();
        if (!hayCambios || !completo) return;

        setGuardando(true);
        try {
            const { data } = await apiQuery.patch("/colectivos/me", cambios, {
                mensajeError: "No se pudieron guardar los cambios.",
            });
            const editables = datosEditables(data);
            setOriginal(editables);
            setDatos(editables);
            alertas.exito("Los datos de tu organización se guardaron correctamente.");
        } catch {
            // apiQuery ya mostró la alerta con el motivo (p. ej. nombre en uso)
        } finally {
            setGuardando(false);
        }
    };

    const darDeBajaOrganizacion = async () => {
        setDandoDeBaja(true);
        try {
            await apiQuery.delete(`/colectivos/${idColectivo}`, {
                mensajeError: "No se pudo dar de baja la organización.",
            });
        } catch {
            // apiQuery ya muestra la alerta
            setDandoDeBaja(false);
            setConfirmarBaja(false);
            return;
        }

        // Las cuentas quedaron desactivadas: se cierra la sesión
        try {
            await sesion.cerrarSesion();
        } catch {
            // La cuenta ya no existe; la cookie vence sola
        }
        alertas.exito("Tu organización fue dada de baja.");
        router.replace("/");
        router.refresh();
    };

    if (error) {
        return (
            <p role="alert" className="text-error">
                {error}
            </p>
        );
    }

    if (!datos) {
        return (
            <section aria-busy="true" aria-label="Cargando datos de la organización" className="flex flex-col gap-3">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton />
                <Skeleton />
                <Skeleton className="h-24" />
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1>Mi organización</h1>
                <p className="text-muted">
                    Actualizá los datos que ven las personas colaboradoras cuando visitan tus proyectos.
                </p>
            </header>

            <Card as="form" onSubmit={guardar} className="gap-5" aria-label="Editar datos de la organización">
                <PasoDatosColectivo colectivo={datos} onChange={actualizarCampo} titulo={null} />

                <div className="flex flex-wrap justify-end gap-3">
                    <Button onClick={() => setDatos(original)} disabled={!hayCambios || guardando}>
                        Descartar cambios
                    </Button>
                    <Button type="submit" variant="primary" cargando={guardando} disabled={!hayCambios || !completo}>
                        Guardar cambios
                    </Button>
                </div>
            </Card>

            {esTitular && (
                <Card className="items-start">
                    <h2 className="m-0 font-sans text-base">Dar de baja la organización</h2>
                    <p className="m-0 text-muted">
                        Se finalizan todos tus proyectos, se rechazan sus postulaciones pendientes y se cierran las
                        colaboraciones activas. Tu cuenta y las de los administradores se eliminan. El historial de
                        proyectos y colaboraciones se conserva.
                    </p>
                    <Button variant="danger" onClick={() => setConfirmarBaja(true)}>
                        Dar de baja la organización
                    </Button>
                </Card>
            )}

            <Modal
                open={confirmarBaja}
                onClose={() => !dandoDeBaja && setConfirmarBaja(false)}
                title="¿Dar de baja la organización?"
                footer={
                    <>
                        <Button onClick={() => setConfirmarBaja(false)} disabled={dandoDeBaja}>Cancelar</Button>
                        <Button variant="danger" onClick={darDeBajaOrganizacion} cargando={dandoDeBaja}>
                            Dar de baja
                        </Button>
                    </>
                }
            >
                <p className="m-0">
                    Se eliminan todas las cuentas de la organización. La acción no se puede deshacer.
                </p>
            </Modal>
        </section>
    );
}
