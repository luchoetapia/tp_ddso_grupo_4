"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Card, Skeleton, Tag } from "@/components/common";
import AvisosModeracion from "@/components/moderacion/AvisosModeracion";

const CANTIDAD_PROYECTOS = 5;

const mensajeDeError = (e, porDefecto) => {
    if (e.response?.status === 401) return "Iniciá sesión para ver tu inicio.";
    return e.response?.data?.message ?? porDefecto;
};

export default function InicioColaboradora() {
    const [perfil, setPerfil] = useState(null);
    const [proyectos, setProyectos] = useState(null);
    const [cantidadMensajes, setCantidadMensajes] = useState(null);
    const [errorPerfil, setErrorPerfil] = useState(null);
    const [errorProyectos, setErrorProyectos] = useState(null);
    const [errorMensajes, setErrorMensajes] = useState(null);

    useEffect(() => {
        const cargar = async () => {
            let colaboradora;
            try {
                ({ data: colaboradora } = await axios.get("/api/colaboradores/me"));
                setPerfil(colaboradora);
            } catch (e) {
                setErrorPerfil(mensajeDeError(e, "No se pudo cargar tu perfil."));
                setProyectos([]);
                return;
            }

            try {
                const { data } = await axios.get(
                    `/api/colaboradores/${colaboradora.cuentaGit}/buscarPotencialesProyectos`,
                    { params: { limite: CANTIDAD_PROYECTOS } }
                );
                setProyectos(data.data);
            } catch (e) {
                setErrorProyectos(mensajeDeError(e, "No se pudieron cargar los proyectos."));
                setProyectos([]);
            }
        };
        cargar();
    }, []);

    useEffect(() => {
        axios
            .get("/api/colaboradores/me/notificaciones")
            .then(({ data }) => setCantidadMensajes(data.length))
            .catch((e) => setErrorMensajes(mensajeDeError(e, "No se pudieron cargar tus mensajes.")));
    }, []);

    if (errorPerfil) {
        return (
            <p role="alert" className="text-error">
                {errorPerfil}
            </p>
        );
    }

    return (
        <section className="flex flex-col gap-6">
            <AvisosModeracion url="/colaboradores/me/avisosModeracion" />

            <header className="flex flex-col gap-2">
                <h1>{perfil ? `Hola, ${perfil.nombreFantasia || perfil.nombre}` : "Hola"}</h1>
                {perfil && (
                    <div className="flex flex-wrap items-center gap-2">
                        {perfil.habilidades.length > 0 ? (
                            perfil.habilidades.map((h) => <Tag key={h.id}>{h.titulo}</Tag>)
                        ) : (
                            <p className="text-muted">Todavía no cargaste habilidades en tu perfil.</p>
                        )}
                    </div>
                )}
            </header>

            <Card as="section" aria-labelledby="titulo-mensajes">
                <h2 id="titulo-mensajes" className="font-sans text-base">
                    Mensajes internos
                </h2>
                {errorMensajes && (
                    <p role="alert" className="text-error">
                        {errorMensajes}
                    </p>
                )}
                {!errorMensajes && cantidadMensajes === null && <Skeleton />}
                {cantidadMensajes !== null && (
                    <p>
                        {cantidadMensajes === 0
                            ? "Todavía no recibiste mensajes."
                            : `Tenés ${cantidadMensajes} ${cantidadMensajes === 1 ? "mensaje" : "mensajes"} de colectivos.`}{" "}
                        {cantidadMensajes > 0 && (
                            <Link href="/mensajes" className="font-semibold underline">
                                Ver mensajes
                            </Link>
                        )}
                    </p>
                )}
            </Card>

            <section aria-labelledby="titulo-proyectos" aria-busy={proyectos === null} className="flex flex-col gap-3">
                <h2 id="titulo-proyectos">Proyectos que encajan con tus habilidades</h2>

                {errorProyectos && (
                    <p role="alert" className="text-error">
                        {errorProyectos}
                    </p>
                )}

                {proyectos === null && (
                    <div className="flex flex-col gap-3">
                        <Skeleton />
                        <Skeleton />
                    </div>
                )}

                {proyectos?.length === 0 && !errorProyectos && (
                    <p className="text-muted">
                        Por ahora no hay proyectos que encajen. Sumá habilidades a tu perfil para ver más.
                    </p>
                )}

                {proyectos?.length > 0 && (
                    <ul className="flex flex-col gap-3">
                        {proyectos.map((p) => (
                            <Card as="li" key={p.id}>
                                <h3 className="font-sans text-base">{p.titulo}</h3>
                                <p className="line-clamp-2">{p.descripcion}</p>
                                <div className="flex flex-wrap gap-2">
                                    {p.perfiles.map((perfilRequerido) => (
                                        <Tag key={perfilRequerido.id}>{perfilRequerido.titulo}</Tag>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </ul>
                )}
            </section>
        </section>
    );
}