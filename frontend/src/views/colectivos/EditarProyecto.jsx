'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import alertas from '@/services/alertas'
import { Button, Card, Skeleton } from '@/components/common'
import FormularioProyecto from '@/components/proyectos/FormularioProyecto'
import { perfilDesdeApi, perfilParaEnviar } from '@/components/proyectos/FormularioPerfil'

const CAMPOS_PROYECTO = ['titulo', 'descripcion', 'enlaceSistema', 'enlaceCodigoFuente', 'estrategiaAceptacion'];

const estiloLink = 'inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-[18px] py-2 font-semibold text-text';

const proyectoDesdeApi = (p) => ({
    titulo: p.titulo ?? '',
    descripcion: p.descripcion ?? '',
    enlaceSistema: p.enlaceSistema ?? '',
    enlaceCodigoFuente: p.enlaceCodigoFuente ?? '',
    estrategiaAceptacion: p.estrategiaAceptacion ?? 'RevisionManual',
});

const cambiosDelProyecto = (original, editado) => Object.fromEntries(
    CAMPOS_PROYECTO
        .filter((campo) => editado[campo].trim() !== original[campo])
        .map((campo) => {
            const valor = editado[campo].trim();
            const esEnlace = campo.startsWith('enlace');
            return [campo, esEnlace && valor === '' ? null : valor];
        })
);

const mismoContenido = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default function EditarProyecto() {
    const router = useRouter();
    const id = useSearchParams().get('id');

    const [guardado, setGuardado] = useState(null);
    const [proyecto, setProyecto] = useState(null);
    const [perfiles, setPerfiles] = useState([]);
    const [error, setError] = useState(null);
    const [intento, setIntento] = useState(0);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (!id) return;
        const controlador = new AbortController();
        Promise.all([
            apiQuery.get(`/proyectos/${id}`, { signal: controlador.signal, alertarError: false, mensajeError: 'No se pudo cargar el proyecto.' }),
            apiQuery.get('/colectivos/me', { signal: controlador.signal, alertarError: false }),
        ])
            .then(([datos, colectivo]) => {
                if (!colectivo.proyectos.some((p) => p.id === datos.id)) {
                    setError('Este proyecto no pertenece a tu organización.');
                    return;
                }
                const perfilesForm = datos.perfiles.map(perfilDesdeApi);
                setGuardado({
                    finalizado: datos.finalizado,
                    proyecto: proyectoDesdeApi(datos),
                    perfiles: Object.fromEntries(perfilesForm.map((p) => [p.id, perfilParaEnviar(p)])),
                });
                setProyecto(proyectoDesdeApi(datos));
                setPerfiles(perfilesForm);
            })
            .catch((err) => {
                if (err.cancelado) return;
                if (err.status === 403) router.replace('/');
                else setError(err.mensaje ?? 'No se pudo cargar el proyecto.');
            });
        return () => controlador.abort();
    }, [id, intento, router]);

    const guardar = async () => {
        const base = `/proyectos/${id}/perfiles`;
        const idsEnFormulario = new Set(perfiles.filter((p) => p.id).map((p) => p.id));
        const aEliminar = Object.keys(guardado.perfiles).filter((idPerfil) => !idsEnFormulario.has(idPerfil));
        const aCrear = perfiles.filter((p) => !p.id);
        const aModificar = perfiles.filter((p) => p.id && !mismoContenido(perfilParaEnviar(p), guardado.perfiles[p.id]));
        const cambios = cambiosDelProyecto(guardado.proyecto, proyecto);

        if (!aEliminar.length && !aCrear.length && !aModificar.length && !Object.keys(cambios).length) {
            alertas.info('No hay cambios para guardar.');
            return;
        }

        setEnviando(true);
        const perfilesGuardados = { ...guardado.perfiles };
        let proyectoGuardado = guardado.proyecto;
        try {
            for (const idPerfil of aEliminar) {
                await apiQuery.delete(`${base}/${idPerfil}`, { mensajeError: 'No se pudo eliminar un perfil.' });
                delete perfilesGuardados[idPerfil];
            }
            for (const perfil of aModificar) {
                const datos = perfilParaEnviar(perfil);
                await apiQuery.put(`${base}/${perfil.id}`, datos, { mensajeError: `No se pudo guardar el perfil "${perfil.titulo}".` });
                perfilesGuardados[perfil.id] = datos;
            }
            for (const perfil of aCrear) {
                const datos = perfilParaEnviar(perfil);
                const { data } = await apiQuery.post(base, datos, { mensajeError: `No se pudo crear el perfil "${perfil.titulo}".` });
                perfilesGuardados[data.id] = datos;
                setPerfiles((lista) => lista.map((p) => (p.clave === perfil.clave ? { ...p, id: data.id } : p)));
            }
            if (Object.keys(cambios).length) {
                await apiQuery.patch(`/proyectos/${id}`, cambios, { mensajeError: 'No se pudieron guardar los datos del proyecto.' });
                proyectoGuardado = { ...proyecto, ...Object.fromEntries(Object.entries(cambios).map(([k, v]) => [k, v ?? ''])) };
            }
            alertas.exito('Guardaste los cambios del proyecto.');
            router.push('/colectivo/misProyectos');
        } catch {
            // apiQuery ya mostró la alerta; lo que se guardó queda registrado para el próximo intento
            setEnviando(false);
        } finally {
            setGuardado((g) => ({ ...g, proyecto: proyectoGuardado, perfiles: perfilesGuardados }));
        }
    };

    if (!id || error) {
        return (
            <Card role="alert" className="items-start">
                <p className="m-0">{error ?? 'No se indicó qué proyecto editar.'}</p>
                <div className="flex flex-wrap gap-2">
                    {error && <Button onClick={() => { setError(null); setIntento((n) => n + 1); }}>Reintentar</Button>}
                    <Link href="/colectivo/misProyectos" className={estiloLink}>Volver a mis proyectos</Link>
                </div>
            </Card>
        );
    }

    if (!proyecto) {
        return (
            <section aria-busy="true" aria-label="Cargando proyecto" className="flex flex-col gap-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-[260px] rounded-[14px]" />
                <Skeleton className="h-[320px] rounded-[14px]" />
            </section>
        );
    }

    if (guardado.finalizado) {
        return (
            <Card role="alert" className="items-start">
                <p className="m-0">Este proyecto está finalizado y ya no se puede editar.</p>
                <Link href="/colectivo/misProyectos" className={estiloLink}>Volver a mis proyectos</Link>
            </Card>
        );
    }

    return (
        <section aria-labelledby="titulo-editar-proyecto" className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 id="titulo-editar-proyecto" className="m-0">Editar proyecto</h1>
                <p className="m-0 text-muted">
                    Los cambios en los perfiles se aplican al guardar. Las postulaciones y colaboraciones existentes se mantienen.
                </p>
            </header>

            <FormularioProyecto
                proyecto={proyecto}
                setProyecto={setProyecto}
                perfiles={perfiles}
                setPerfiles={setPerfiles}
                onEnviar={guardar}
                enviando={enviando}
                textoEnviar="Guardar cambios"
                hrefCancelar="/colectivo/misProyectos"
            />
        </section>
    );
}
