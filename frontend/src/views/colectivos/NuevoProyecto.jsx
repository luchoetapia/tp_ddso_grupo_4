'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import alertas from '@/services/alertas'
import { Button, Card, Input, Select, Skeleton, Textarea } from '@/components/common'
import FormularioPerfil, { perfilParaEnviar, perfilVacio, validarPerfil } from '@/components/proyectos/FormularioPerfil'

// Mismos nombres que registra la API (EstrategiaAceptacion)
const ESTRATEGIAS = {
    RevisionManual: {
        texto: 'Revisión manual',
        ayuda: 'Revisás y aceptás o rechazás cada postulación.',
    },
    TodoSuma: {
        texto: 'Todo suma',
        ayuda: 'Se aceptan todas las postulaciones automáticamente. Solo si ningún perfil tiene límite.',
    },
    HastaLlenarVacantes: {
        texto: 'Hasta llenar las vacantes',
        ayuda: 'Se aceptan automáticamente hasta llegar al límite y después se cierra la búsqueda. Necesita algún perfil con límite.',
    },
};

const estiloLink = 'inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-[18px] py-2 font-semibold text-text';

const esUrl = (texto) => {
    try {
        const url = new URL(texto);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const proyectoVacio = {
    titulo: '',
    descripcion: '',
    enlaceSistema: '',
    enlaceCodigoFuente: '',
    estrategiaAceptacion: 'RevisionManual',
};

// Si una estrategia no se puede usar con los límites cargados, se explica por qué
const estrategiaAplicable = (estrategia, perfiles) => {
    const algunoConLimite = perfiles.some((p) => p.limiteColaboraciones !== '');
    if (estrategia === 'TodoSuma') return !algunoConLimite;
    if (estrategia === 'HastaLlenarVacantes') return algunoConLimite;
    return true;
};

const validarProyecto = (proyecto, perfiles) => {
    const errores = {};
    if (!proyecto.titulo.trim()) errores.titulo = 'El proyecto necesita un título.';
    if (!proyecto.descripcion.trim()) errores.descripcion = 'Contá de qué se trata el proyecto.';
    if (proyecto.enlaceSistema.trim() && !esUrl(proyecto.enlaceSistema.trim())) {
        errores.enlaceSistema = 'Ingresá una URL válida (https://…).';
    }
    if (proyecto.enlaceCodigoFuente.trim() && !esUrl(proyecto.enlaceCodigoFuente.trim())) {
        errores.enlaceCodigoFuente = 'Ingresá una URL válida (https://…).';
    }
    if (!estrategiaAplicable(proyecto.estrategiaAceptacion, perfiles)) {
        errores.estrategiaAceptacion = ESTRATEGIAS[proyecto.estrategiaAceptacion].ayuda;
    }
    return errores;
};

export default function NuevoProyecto() {
    const router = useRouter();
    const [habilidades, setHabilidades] = useState(null);
    const [proyecto, setProyecto] = useState(proyectoVacio);
    const [perfiles, setPerfiles] = useState(() => [perfilVacio()]);
    const [mostrarErrores, setMostrarErrores] = useState(false);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        const controlador = new AbortController();
        apiQuery
            .get('/habilidades', {
                params: { limite: 100, orden: 'titulo', direccion: 'asc' },
                signal: controlador.signal,
                mensajeError: 'No se pudieron cargar las habilidades.',
            })
            .then(({ data }) => setHabilidades(data))
            .catch((err) => {
                if (!err.cancelado) setHabilidades([]);
            });
        return () => controlador.abort();
    }, []);

    const erroresProyecto = validarProyecto(proyecto, perfiles);
    const erroresPerfiles = perfiles.map(validarPerfil);
    const hayErrores = Object.keys(erroresProyecto).length > 0 || erroresPerfiles.some((e) => Object.keys(e).length > 0);

    const actualizarProyecto = (nombre, valor) => setProyecto((p) => ({ ...p, [nombre]: valor }));
    const actualizarPerfil = (clave) => (nombre, valor) =>
        setPerfiles((lista) => lista.map((p) => (p.clave === clave ? { ...p, [nombre]: valor } : p)));
    const quitarPerfil = (clave) => setPerfiles((lista) => lista.filter((p) => p.clave !== clave));
    const agregarPerfil = () => setPerfiles((lista) => [...lista, perfilVacio()]);

    const campo = (nombre) => ({
        name: nombre,
        value: proyecto[nombre],
        error: mostrarErrores ? erroresProyecto[nombre] : undefined,
        onChange: (e) => actualizarProyecto(nombre, e.target.value),
    });

    const crear = async (e) => {
        e.preventDefault();
        setMostrarErrores(true);
        if (hayErrores) {
            alertas.error('Revisá los campos marcados antes de crear el proyecto.');
            return;
        }

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

            <form onSubmit={crear} noValidate className="flex flex-col gap-6">
                <Card className="gap-4">
                    <h2 className="m-0 font-sans text-[19px] font-bold">Datos del proyecto</h2>
                    <Input label="Título" {...campo('titulo')} required />
                    <Textarea label="Descripción" rows={4} {...campo('descripcion')} required />
                    <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                        <Input
                            label="Enlace al código fuente (opcional)"
                            type="url"
                            placeholder="https://github.com/…"
                            {...campo('enlaceCodigoFuente')}
                        />
                        <Input
                            label="Enlace al sistema en producción (opcional)"
                            type="url"
                            placeholder="https://…"
                            {...campo('enlaceSistema')}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Select label="Aceptación de postulaciones" {...campo('estrategiaAceptacion')}>
                            {Object.entries(ESTRATEGIAS).map(([valor, { texto }]) => (
                                <option key={valor} value={valor}>{texto}</option>
                            ))}
                        </Select>
                        {!(mostrarErrores && erroresProyecto.estrategiaAceptacion) && (
                            <p className="m-0 text-[13px] text-muted">{ESTRATEGIAS[proyecto.estrategiaAceptacion].ayuda}</p>
                        )}
                    </div>
                </Card>

                <section aria-labelledby="titulo-perfiles" className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 id="titulo-perfiles" className="m-0 font-sans text-[19px] font-bold">
                            Perfiles requeridos ({perfiles.length})
                        </h2>
                        <p className="m-0 text-muted">
                            Cada perfil tiene sus habilidades, compromiso de horas y modalidad.
                        </p>
                    </div>

                    {habilidades === null ? (
                        <div aria-busy="true" aria-label="Cargando habilidades" className="flex flex-col gap-3">
                            <Skeleton className="h-[320px] rounded-[14px]" />
                        </div>
                    ) : (
                        perfiles.map((perfil, i) => (
                            <FormularioPerfil
                                key={perfil.clave}
                                perfil={perfil}
                                numero={i + 1}
                                habilidades={habilidades}
                                errores={mostrarErrores ? erroresPerfiles[i] : {}}
                                onChange={actualizarPerfil(perfil.clave)}
                                onQuitar={() => quitarPerfil(perfil.clave)}
                            />
                        ))
                    )}

                    {perfiles.length === 0 && (
                        <Card className="items-center py-6 text-center">
                            <p className="m-0 text-muted">
                                Sin perfiles nadie va a poder postularse. Podés agregarlos ahora o más adelante.
                            </p>
                        </Card>
                    )}

                    <Button onClick={agregarPerfil} className="self-start">
                        + Agregar perfil
                    </Button>
                </section>

                <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
                    <Link href="/colectivo/misProyectos" className={estiloLink}>Cancelar</Link>
                    <Button type="submit" variant="primary" cargando={enviando} disabled={habilidades === null}>
                        Crear proyecto
                    </Button>
                </div>
            </form>
        </section>
    );
}
