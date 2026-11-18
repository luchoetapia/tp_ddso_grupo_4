'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import alertas from '@/services/alertas'
import FormularioProyecto, { proyectoVacio } from '@/components/proyectos/FormularioProyecto'
import { perfilParaEnviar, perfilVacio } from '@/components/proyectos/FormularioPerfil'

export default function NuevoProyecto() {
    const router = useRouter();
    const [proyecto, setProyecto] = useState(proyectoVacio);
    const [perfiles, setPerfiles] = useState(() => [perfilVacio()]);
    const [enviando, setEnviando] = useState(false);

    const crear = async () => {
        const datos = {
            titulo: proyecto.titulo.trim(),
            descripcion: proyecto.descripcion.trim(),
            perfiles: perfiles.map(perfilParaEnviar),
            estrategiaAceptacion: proyecto.estrategiaAceptacion,
            ...(proyecto.enlaceSistema.trim() && { enlaceSistema: proyecto.enlaceSistema.trim() }),
            ...(proyecto.enlaceCodigoFuente.trim() && { enlaceCodigoFuente: proyecto.enlaceCodigoFuente.trim() }),
        };

        setEnviando(true);
        try {
            await apiQuery.post('/proyectos', datos, { mensajeError: 'No se pudo crear el proyecto.' });
            alertas.exito(`Creaste el proyecto "${datos.titulo}".`);
            router.push('/colectivo/misProyectos');
        } catch {
            // apiQuery ya mostró la alerta con el motivo (p. ej. título repetido)
            setEnviando(false);
        }
    };

    return (
        <section aria-labelledby="titulo-nuevo-proyecto" className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 id="titulo-nuevo-proyecto" className="m-0">Nuevo proyecto</h1>
                <p className="m-0 text-muted">
                    Contá de qué se trata y qué perfiles necesitás. Las personas colaboradoras se postulan a cada perfil.
                </p>
            </header>

            <FormularioProyecto
                proyecto={proyecto}
                setProyecto={setProyecto}
                perfiles={perfiles}
                setPerfiles={setPerfiles}
                onEnviar={crear}
                enviando={enviando}
                textoEnviar="Crear proyecto"
                hrefCancelar="/colectivo/misProyectos"
            />
        </section>
    );
}
