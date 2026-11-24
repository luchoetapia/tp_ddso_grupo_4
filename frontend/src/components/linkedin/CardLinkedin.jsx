'use client'

import { useState } from "react";
import { conectarLinkedin } from "@/services/linkedin";
import { BotonLinkedin, Card, Tag } from "@/components/common";

// Estado de la conexión con LinkedIn de la cuenta logueada: para publicar hace falta tenerla conectada con permiso vigente.
// linkedin: usuario.linkedin de la sesión (null si no está vinculada).
// para: qué se puede compartir, para completar los textos (ej: "los proyectos en los que colaborás").
export default function CardLinkedin({ linkedin, para }) {
    const [conectando, setConectando] = useState(false);
    const nombre = [linkedin?.nombre, linkedin?.apellido].filter(Boolean).join(" ");

    const conectar = async () => {
        setConectando(true);
        await conectarLinkedin();
    };

    let descripcion;
    if (linkedin?.puedePublicar) {
        descripcion = `Conectado${nombre ? ` como ${nombre}` : ""}. Podés compartir en LinkedIn ${para}.`;
    } else if (linkedin) {
        descripcion = `Tu conexión con LinkedIn venció o no tiene permiso para publicar. Reconectala para compartir ${para}.`;
    } else {
        descripcion = `Conectá tu cuenta de LinkedIn para compartir ${para}.`;
    }

    return (
        <Card className="items-start">
            <div className="flex flex-wrap items-center gap-2">
                <h2 className="m-0 font-sans text-base">LinkedIn</h2>
                <Tag variant={linkedin?.puedePublicar ? "accent" : "neutral"}>
                    {linkedin?.puedePublicar ? "Conectado" : "Sin conectar"}
                </Tag>
            </div>
            <p className="m-0 text-muted">{descripcion}</p>
            {!linkedin?.puedePublicar && (
                <BotonLinkedin onClick={conectar} deshabilitado={conectando}>
                    {linkedin ? "Reconectar LinkedIn" : "Conectar LinkedIn"}
                </BotonLinkedin>
            )}
        </Card>
    );
}
