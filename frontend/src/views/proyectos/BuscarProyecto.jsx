'use client'

import { useState } from 'react'
import { Button, Card, Checkbox, Input, ProgressBar, Skeleton, Tag } from '@/components/common'
import apiQuery from '@/services/api/apiQuery'

const BuscarProyecto = () => {

    const [texto, setTexto] = useState('');
    const [soloMisHabilidades, setSoloMisHabilidades] = useState(false);
    // null = todavía no se buscó
    const [proyectos, setProyectos] = useState(null);
    const [cargando, setCargando] = useState(false);
    // TEMPORAL: hasta que haya un endpoint que devuelva el colaborador logueado
    const [cuentaGit, setCuentaGit] = useState('');

    const busquedaNormal = async () => {
        // Si falla, apiQuery ya muestra la alerta con el error
        try {
            // El listado viene paginado: { data, paginacion }
            const { data } = await apiQuery.get('/proyectos', { params: { texto }, mensajeError: 'No se pudieron buscar los proyectos.' });
            return data;
        } catch {
            return [];
        }
    }

    const busquedaPorHabilidades = async () => {
        let data;
        try {
            ({ data } = await apiQuery.get(
                `/colaboradores/${encodeURIComponent(cuentaGit)}/buscarPotencialesProyectos`,
                { mensajeError: 'No se pudieron buscar los proyectos.' }
            ));
        } catch {
            return [];
        }

        // El endpoint no filtra por texto: si hay algo escrito, filtro acá por título o descripción
        const textoBuscado = texto.trim().toLowerCase();
        if (!textoBuscado) return data;

        return data.filter((proyecto) =>
            proyecto.titulo.toLowerCase().includes(textoBuscado) ||
            proyecto.descripcion.toLowerCase().includes(textoBuscado)
        );
    }

    const buscarProyectos = async (e) => {
        e.preventDefault();
        setCargando(true);
        const encontrados = soloMisHabilidades
            ? await busquedaPorHabilidades()
            : await busquedaNormal();
        setProyectos(encontrados);
        setCargando(false);
    }

    return (
        <section className="flex flex-col gap-[18px]">
            <h1>Proyectos</h1>

            <form onSubmit={buscarProyectos} role="search" className="flex flex-wrap items-end gap-3">
                <Input
                    type="search"
                    label="Buscar"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Título o descripción..."
                    className="min-w-[220px] flex-1"
                />
                {soloMisHabilidades && (
                    <Input
                        label="Tu cuenta de Git (temporal)"
                        value={cuentaGit}
                        onChange={(e) => setCuentaGit(e.target.value)}
                        placeholder="usuario"
                        className="min-w-[180px]"
                    />
                )}
                <Checkbox
                    label="Solo mis habilidades"
                    checked={soloMisHabilidades}
                    onChange={(e) => setSoloMisHabilidades(e.target.checked)}
                    className="min-h-10"
                />
                <Button type="submit" variant="primary" cargando={cargando}>
                    Buscar
                </Button>
            </form>

            <div aria-busy={cargando}>
                {cargando && (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                        <Skeleton className="h-[140px]" />
                        <Skeleton className="h-[140px]" />
                    </div>
                )}

                {!cargando && proyectos === null && (
                    <p className="text-muted">Escribí algo y tocá Buscar para ver los proyectos.</p>
                )}

                {!cargando && proyectos?.length === 0 && (
                    <p className="text-muted">No encontramos proyectos con esa búsqueda.</p>
                )}

                {!cargando && proyectos?.length > 0 && (
                    <ul className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                        {proyectos.map((proyecto) => {
                            const busquedaAbierta = proyecto.perfiles?.some((p) => p.busquedaAbierta);
                            return (
                                <Card as="li" key={proyecto.id}>
                                    <div className="flex flex-wrap items-start gap-2">
                                        <h2 className="flex-1 font-sans text-[17px] font-bold">{proyecto.titulo}</h2>
                                        {proyecto.finalizado
                                            ? <Tag variant="neutral">Finalizado</Tag>
                                            : busquedaAbierta && <Tag>Búsqueda abierta</Tag>}
                                    </div>

                                    <p className="text-[13px] text-muted line-clamp-3">{proyecto.descripcion}</p>

                                    <div className="text-[13px] text-muted">
                                        <ProgressBar value={proyecto.porcentajeFinalizado} label="Avance" />
                                    </div>

                                    {proyecto.perfiles?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {proyecto.perfiles.map((perfil) => (
                                                <Tag key={perfil.id} variant={perfil.busquedaAbierta ? 'accent' : 'neutral'}>
                                                    {perfil.titulo}
                                                </Tag>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>
    )
}

export default BuscarProyecto
