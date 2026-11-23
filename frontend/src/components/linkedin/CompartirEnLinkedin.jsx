'use client'

import { useEffect, useState } from "react";
import apiQuery from "@/services/api/apiQuery";
import alertas from "@/services/alertas";
import sesion from "@/services/sesion";
import { MAX_CARACTERES_POST, borrador, conectarLinkedin, esNoVinculado, textoSugerido, urlSiEsDuplicado } from "@/services/linkedin";

const estiloLinkPost = "font-semibold text-accent underline";
import { BotonLinkedin, Button, Modal, Skeleton, Textarea } from "@/components/common";

// Botón "Compartir en LinkedIn" + modal para escribir y publicar el post.
// proyecto: { id, titulo }. perfil: título del rol del colaborador en el proyecto (opcional).
// abrirAlCargar: abre el modal solo (al volver de conectar LinkedIn, ver useRetornoLinkedin).
// Si el usuario no tiene LinkedIn conectado con permiso para publicar, el modal ofrece conectarlo:
// el texto queda guardado como borrador y el modal se reabre al volver.
export default function CompartirEnLinkedin({ proyecto, perfil, abrirAlCargar = false, onAbierto, className }) {
    const textoInicial = () =>
        borrador.leer(proyecto.id) ?? textoSugerido({ titulo: proyecto.titulo, perfil, idProyecto: proyecto.id });

    const [abierto, setAbierto] = useState(abrirAlCargar);
    // undefined: cargando · null: sin LinkedIn · { nombre, apellido, puedePublicar }
    const [linkedin, setLinkedin] = useState(undefined);
    const [texto, setTexto] = useState(() => (abrirAlCargar ? textoInicial() : ""));
    const [errorTexto, setErrorTexto] = useState(null);
    const [publicando, setPublicando] = useState(false);
    const [conectando, setConectando] = useState(false);
    // Post recién publicado: { url } (url puede ser null si LinkedIn no devolvió el id)
    const [publicado, setPublicado] = useState(null);
    // Si LinkedIn rechazó el texto por repetido: link al post que ya existe
    const [urlDuplicado, setUrlDuplicado] = useState(null);

    // Si se abrió solo al volver de LinkedIn, se avisa para que la pantalla no lo vuelva a abrir
    useEffect(() => {
        if (abrirAlCargar) onAbierto?.();
    }, [abrirAlCargar, onAbierto]);

    // El estado de LinkedIn se consulta cada vez que se abre (y no al cargar la pantalla) para tenerlo al día
    useEffect(() => {
        if (!abierto) return;
        let vigente = true;
        sesion.obtenerUsuario().then((usuario) => {
            if (vigente) setLinkedin(usuario?.linkedin ?? null);
        });
        return () => { vigente = false; };
    }, [abierto]);

    const abrir = () => {
        setLinkedin(undefined);
        setErrorTexto(null);
        setPublicado(null);
        setUrlDuplicado(null);
        setTexto(textoInicial());
        setAbierto(true);
    };

    const cerrar = () => {
        if (publicando || conectando) return;
        setAbierto(false);
    };

    const conectar = async () => {
        setConectando(true);
        borrador.guardar(proyecto.id, texto);
        await conectarLinkedin({ publicar: proyecto.id });
        // La página navega a LinkedIn; no se resetea el estado para que el botón siga mostrando el spinner
    };

    const publicar = async () => {
        setPublicando(true);
        setErrorTexto(null);
        setUrlDuplicado(null);
        try {
            const { data } = await apiQuery.post(
                "/linkedin/publicaciones",
                { proyectoId: proyecto.id, texto },
                { alertarError: false }
            );

            borrador.borrar(proyecto.id);
            alertas.exito("¡Listo! Se publicó en tu LinkedIn");
            // El modal queda abierto con el link al post
            setPublicado({ url: data?.url ?? null });
        } catch (error) {
            if (error.cancelado) return;

            if (error.status === 409) {
                // Texto repetido: LinkedIn no deja publicar dos veces lo mismo
                setErrorTexto(error.mensaje);
                setUrlDuplicado(urlSiEsDuplicado(error));
            } else if (esNoVinculado(error)) {
                // Venció o se revocó el permiso: el modal pasa a ofrecer reconectar
                setLinkedin((actual) => ({ ...(actual ?? {}), puedePublicar: false }));
                alertas.aviso(error.mensaje);
            } else if (error.errores?.texto) {
                setErrorTexto(error.errores.texto.join(". "));
            } else {
                alertas.error(error.mensaje);
            }
        } finally {
            setPublicando(false);
        }
    };

    const puedePublicar = !!linkedin?.puedePublicar;
    const textoVacio = !texto.trim();
    const nombreLinkedin = [linkedin?.nombre, linkedin?.apellido].filter(Boolean).join(" ");

    return (
        <>
            <BotonLinkedin onClick={abrir} compacto className={className}>
                Compartir en LinkedIn
            </BotonLinkedin>

            <Modal
                open={abierto}
                onClose={cerrar}
                title={`Compartir "${proyecto.titulo}" en LinkedIn`}
                ancho="max-w-[560px]"
                footer={
                    publicado ? (
                        <Button onClick={cerrar}>Cerrar</Button>
                    ) : linkedin === undefined ? null : (
                        <>
                            <Button onClick={cerrar} disabled={publicando || conectando}>Cancelar</Button>
                            {puedePublicar ? (
                                <Button variant="primary" onClick={publicar} cargando={publicando} disabled={textoVacio}>
                                    Publicar
                                </Button>
                            ) : (
                                <BotonLinkedin
                                    onClick={conectar}
                                    deshabilitado={conectando}
                                    compacto
                                >
                                    {linkedin ? "Reconectar LinkedIn" : "Conectar LinkedIn"}
                                </BotonLinkedin>
                            )}
                        </>
                    )
                }
            >
                {publicado ? (
                    <p className="m-0" role="status">
                        Tu publicación ya está en LinkedIn.{" "}
                        {publicado.url ? (
                            <a href={publicado.url} target="_blank" rel="noopener noreferrer" className={estiloLinkPost}>
                                Ver publicación ↗
                            </a>
                        ) : (
                            "La vas a encontrar en la sección Actividad de tu perfil."
                        )}
                    </p>
                ) : linkedin === undefined ? (
                    <div aria-busy="true" className="flex flex-col gap-2">
                        <Skeleton />
                        <Skeleton />
                    </div>
                ) : (
                    <>
                        {puedePublicar ? (
                            <p className="m-0 text-sm text-muted">
                                Se va a publicar en tu perfil de LinkedIn{nombreLinkedin && ` (${nombreLinkedin})`} y lo va a poder ver cualquier persona.
                            </p>
                        ) : (
                            <p className="m-0 text-sm text-muted" role="status">
                                {linkedin
                                    ? "Tu conexión con LinkedIn venció o no tiene permiso para publicar. "
                                    : "Para compartir tus proyectos tenés que conectar tu cuenta de LinkedIn. "}
                                Te llevamos a LinkedIn para que lo autorices y volvés acá con tu texto guardado.
                            </p>
                        )}

                        <Textarea
                            label="Texto de la publicación"
                            rows={8}
                            value={texto}
                            maxLength={MAX_CARACTERES_POST}
                            onChange={(e) => {
                                setTexto(e.target.value);
                                setErrorTexto(null);
                            }}
                            error={errorTexto}
                        />
                        {urlDuplicado && (
                            <a href={urlDuplicado} target="_blank" rel="noopener noreferrer" className={`${estiloLinkPost} text-[13px]`}>
                                Ver la publicación que ya existe ↗
                            </a>
                        )}
                        <p className="m-0 self-end text-[13px] text-muted" aria-live="polite">
                            {texto.length}/{MAX_CARACTERES_POST}
                        </p>
                    </>
                )}
            </Modal>
        </>
    );
}
