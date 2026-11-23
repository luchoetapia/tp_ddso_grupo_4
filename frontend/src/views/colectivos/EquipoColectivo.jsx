"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, InputContrasena, Modal, Skeleton, Tag } from "@/components/common";
import apiQuery from "@/services/api/apiQuery";
import alertas from "@/services/alertas";

const NUEVO_VACIO = { username: "", email: "", password: "" };

// Mismas reglas que el registro (el back las vuelve a validar)
const validarNuevo = ({ username, email, password }) => {
    const errores = {};
    if (username.trim().length < 3) errores.username = "El nombre de usuario debe tener al menos 3 caracteres.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errores.email = "Ingresá un email válido.";
    if (password.length < 8) errores.password = "La contraseña debe tener al menos 8 caracteres.";
    return errores;
};

export default function EquipoColectivo() {
    const [administradores, setAdministradores] = useState(null);
    const [puedeGestionar, setPuedeGestionar] = useState(false);
    const [error, setError] = useState(null);

    const [nuevo, setNuevo] = useState(NUEVO_VACIO);
    const [errores, setErrores] = useState({});
    const [agregando, setAgregando] = useState(false);

    const [aQuitar, setAQuitar] = useState(null);
    const [quitando, setQuitando] = useState(false);

    useEffect(() => {
        const controlador = new AbortController();
        apiQuery
            .get("/colectivos/me/administradores", {
                signal: controlador.signal,
                alertarError: false,
                mensajeError: "No se pudo cargar el equipo de tu organización.",
            })
            .then(({ data, puedeGestionar }) => {
                setAdministradores(data);
                setPuedeGestionar(puedeGestionar);
            })
            .catch((e) => {
                if (!e.cancelado) setError(e.mensaje);
            });
        return () => controlador.abort();
    }, []);

    const actualizarCampo = (campo, valor) => {
        setNuevo((anterior) => ({ ...anterior, [campo]: valor }));
        setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
    };

    const agregar = async (e) => {
        e.preventDefault();
        const encontrados = validarNuevo(nuevo);
        setErrores(encontrados);
        if (Object.keys(encontrados).length > 0) return;

        setAgregando(true);
        try {
            const { data } = await apiQuery.post(
                "/colectivos/me/administradores",
                { username: nuevo.username.trim(), email: nuevo.email.trim(), password: nuevo.password },
                { mensajeError: "No se pudo agregar al administrador." },
            );
            setAdministradores((anteriores) => [...anteriores, data]);
            setNuevo(NUEVO_VACIO);
            alertas.exito(`Se creó la cuenta de ${data.username}. Ya puede ingresar y administrar la organización.`);
        } catch {
            // apiQuery ya mostró la alerta con el motivo (p. ej. email en uso)
        } finally {
            setAgregando(false);
        }
    };

    const quitar = async () => {
        setQuitando(true);
        try {
            await apiQuery.delete(`/colectivos/me/administradores/${aQuitar.id}`, {
                mensajeError: "No se pudo quitar al administrador.",
            });
            setAdministradores((anteriores) => anteriores.filter((admin) => admin.id !== aQuitar.id));
            alertas.exito(`${aQuitar.username} ya no administra la organización.`);
            setAQuitar(null);
        } catch {
            // apiQuery ya mostró la alerta
        } finally {
            setQuitando(false);
        }
    };

    if (error) {
        return (
            <p role="alert" className="text-error">
                {error}
            </p>
        );
    }

    if (!administradores) {
        return (
            <section aria-busy="true" aria-label="Cargando el equipo de la organización" className="flex flex-col gap-3">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1>Equipo de la organización</h1>
                <p className="text-muted">
                    Todas estas cuentas pueden administrar la organización: editar sus datos y proyectos y revisar
                    postulaciones. Lo que hace cada una queda registrado en la{" "}
                    <Link href="/colectivo/actividad" className="font-semibold text-accent underline">
                        actividad
                    </Link>
                    .
                </p>
            </header>

            <ul className="flex list-none flex-col gap-3 p-0" aria-label="Administradores">
                {administradores.map((admin) => (
                    <Card as="li" key={admin.id} className="flex-row flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="flex flex-wrap items-center gap-2 font-semibold">
                                <span className="truncate">{admin.username}</span>
                                <Tag variant={admin.esTitular ? "accent" : "neutral"}>
                                    {admin.esTitular ? "Cuenta titular" : "Administrador/a"}
                                </Tag>
                            </span>
                            <span className="truncate text-sm text-muted">{admin.email}</span>
                        </div>
                        {puedeGestionar && !admin.esTitular && (
                            <Button variant="danger" onClick={() => setAQuitar(admin)} aria-label={`Quitar a ${admin.username}`}>
                                Quitar
                            </Button>
                        )}
                    </Card>
                ))}
            </ul>

            {puedeGestionar ? (
                <Card as="form" onSubmit={agregar} noValidate className="gap-4" aria-labelledby="titulo-agregar">
                    <div className="flex flex-col gap-1">
                        <h2 id="titulo-agregar" className="text-lg font-bold">
                            Agregar administrador/a
                        </h2>
                        <p className="text-sm text-muted">
                            Se crea una cuenta nueva para esa persona. Compartile el usuario (o el email) y la
                            contraseña para que pueda ingresar.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                            label="Nombre de usuario"
                            value={nuevo.username}
                            onChange={(e) => actualizarCampo("username", e.target.value)}
                            error={errores.username}
                            autoComplete="off"
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={nuevo.email}
                            onChange={(e) => actualizarCampo("email", e.target.value)}
                            error={errores.email}
                            autoComplete="off"
                            required
                        />
                        <InputContrasena
                            label="Contraseña inicial"
                            value={nuevo.password}
                            onChange={(e) => actualizarCampo("password", e.target.value)}
                            error={errores.password}
                            autoComplete="new-password"
                            required
                            className="sm:col-span-2"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" variant="primary" cargando={agregando}>
                            Agregar al equipo
                        </Button>
                    </div>
                </Card>
            ) : (
                <p className="text-sm text-muted">Solo la cuenta titular puede agregar o quitar administradores.</p>
            )}

            <Modal
                open={!!aQuitar}
                onClose={() => !quitando && setAQuitar(null)}
                title="¿Quitar administrador/a?"
                footer={
                    <>
                        <Button onClick={() => setAQuitar(null)} disabled={quitando}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={quitar} cargando={quitando}>
                            Sí, quitar
                        </Button>
                    </>
                }
            >
                <p className="text-sm">
                    <strong>{aQuitar?.username}</strong> dejará de administrar la organización y su cuenta se va a
                    desactivar. <strong>Esta acción es permanente</strong>: para volver a sumarla hay que crear una
                    cuenta nueva.
                </p>
            </Modal>
        </section>
    );
}
