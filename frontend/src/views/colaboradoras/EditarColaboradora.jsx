"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Skeleton } from "@/components/common";
import PasoDatosColaborador from "@/components/registro/PasoDatosColaborador";
import EditorContactos, { errorDeContacto } from "@/components/colaboradores/EditorContactos";
import apiQuery from "@/services/api/apiQuery";
import alertas from "@/services/alertas";

const TEXTOS = ["nombre", "apellido", "nombreFantasia", "pronombres", "presentacion"];

const datosEditables = (colaboradora, contactos) => ({
    ...Object.fromEntries(TEXTOS.map((campo) => [campo, colaboradora[campo] ?? ""])),
    cuentaGit: colaboradora.cuentaGit,
    habilidades: (colaboradora.habilidades ?? []).map((h) => h.id ?? h),
    deseaSerContactado: !!colaboradora.deseaSerContactado,
    contactos: contactos.map(({ medio, valor }) => ({ medio, valor })),
});

const normalizarTexto = (valor) => (valor?.trim() ? valor.trim() : null);
const normalizarContactos = (contactos) => contactos.map(({ medio, valor }) => ({ medio, valor: valor.trim() }));
const mismasHabilidades = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

const obtenerCambios = (original, editado) => {
    const cambios = {};
    TEXTOS.forEach((campo) => {
        const valor = normalizarTexto(editado[campo]);
        if (valor !== normalizarTexto(original[campo])) cambios[campo] = valor;
    });
    if (!mismasHabilidades(original.habilidades, editado.habilidades)) cambios.habilidades = editado.habilidades;
    if (original.deseaSerContactado !== editado.deseaSerContactado) cambios.deseaSerContactado = editado.deseaSerContactado;
    const contactos = normalizarContactos(editado.contactos);
    if (JSON.stringify(contactos) !== JSON.stringify(normalizarContactos(original.contactos))) cambios.contactos = contactos;
    return cambios;
};

export default function EditarColaboradora() {
    const [original, setOriginal] = useState(null);
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [mostrarErrores, setMostrarErrores] = useState(false);

    useEffect(() => {
        const controlador = new AbortController();
        const opciones = { signal: controlador.signal, alertarError: false, mensajeError: "No se pudo cargar tu perfil." };

        apiQuery
            .get("/colaboradores/me", opciones)
            .then(async (colaboradora) => {
                const contactos = await apiQuery.get(`/colaboradores/${encodeURIComponent(colaboradora.cuentaGit)}/contactos`, opciones);
                const editables = datosEditables(colaboradora, contactos);
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
    const sinNombre = datos && !datos.nombre.trim() && !datos.nombreFantasia.trim();
    const contactosConError = datos ? datos.contactos.some((c) => errorDeContacto(c)) : false;

    const guardar = async (e) => {
        e.preventDefault();
        setMostrarErrores(true);
        if (!hayCambios) return;
        if (sinNombre) {
            alertas.error("Indicá tu nombre o un nombre de fantasía.");
            return;
        }
        if (contactosConError) {
            alertas.error("Revisá los medios de contacto marcados.");
            return;
        }

        setGuardando(true);
        try {
            const { data } = await apiQuery.patch("/colaboradores/me", cambios, {
                mensajeError: "No se pudieron guardar los cambios.",
            });
            const editables = datosEditables(data, normalizarContactos(datos.contactos));
            setOriginal(editables);
            setDatos(editables);
            setMostrarErrores(false);
            alertas.exito("Tu perfil se guardó correctamente.");
        } catch {
        } finally {
            setGuardando(false);
        }
    };

    const descartar = () => {
        setDatos(original);
        setMostrarErrores(false);
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
            <section aria-busy="true" aria-label="Cargando tu perfil" className="flex flex-col gap-3">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton />
                <Skeleton />
                <Skeleton className="h-24" />
                <Skeleton className="h-16" />
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-2">
                    <h1>Mi perfil</h1>
                    <p className="text-muted">
                        Mantené al día tus habilidades y tus datos: así te encuentran los proyectos que más te encajan.
                    </p>
                </div>
                <Link
                    href={`/colaboradoras/perfil?cuentaGit=${encodeURIComponent(datos.cuentaGit)}`}
                    className="font-semibold text-accent underline"
                >
                    Ver mi perfil público
                </Link>
            </header>

            <Card as="form" onSubmit={guardar} noValidate className="gap-6" aria-label="Editar mi perfil">
                <PasoDatosColaborador colaborador={datos} onChange={actualizarCampo} titulo={null} cuentaGitEditable={false} />

                {mostrarErrores && sinNombre && (
                    <p role="alert" className="m-0 text-[13px] text-error">
                        Indicá tu nombre o un nombre de fantasía.
                    </p>
                )}

                <hr className="m-0 border-border" />

                <EditorContactos
                    contactos={datos.contactos}
                    onChange={(contactos) => actualizarCampo("contactos", contactos)}
                    mostrarErrores={mostrarErrores}
                />

                <div className="flex flex-wrap justify-end gap-3">
                    <Button onClick={descartar} disabled={!hayCambios || guardando}>
                        Descartar cambios
                    </Button>
                    <Button type="submit" variant="primary" cargando={guardando} disabled={!hayCambios}>
                        Guardar cambios
                    </Button>
                </div>
            </Card>
        </section>
    );
}
