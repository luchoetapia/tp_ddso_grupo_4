'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiQuery from '@/services/api/apiQuery'
import { Card, Skeleton } from '@/components/common'
import ListadoProyectos from '@/views/proyectos/ListadoProyectos'

// Listado de proyectos para el colaborador logueado: el mismo listado público
// más el filtro "Solo proyectos que buscan mis habilidades", que usa su perfil.
const BuscarProyecto = () => {
    const [perfil, setPerfil] = useState({ cargando: true, cuentaGit: null, error: null });

    useEffect(() => {
        const controlador = new AbortController();
        apiQuery.get('/colaboradores/me', { signal: controlador.signal, alertarError: false })
            .then(({ cuentaGit }) => setPerfil({ cargando: false, cuentaGit, error: null }))
            .catch((err) => {
                if (!err.cancelado) setPerfil({ cargando: false, cuentaGit: null, error: err.status });
            });
        return () => controlador.abort();
    }, []);

    if (perfil.cargando) {
        return (
            <div aria-busy="true" className="flex flex-col gap-[18px]">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-[150px] rounded-[14px]" />
                <span className="sr-only" role="status">Cargando tu perfil…</span>
            </div>
        );
    }

    if (perfil.error) {
        return (
            <Card role="alert" className="items-start">
                <p className="m-0">
                    {perfil.error === 401 || perfil.error === 403
                        ? 'Ingresá con tu cuenta de colaborador para buscar proyectos según tus habilidades.'
                        : 'No pudimos cargar tu perfil.'}
                </p>
                <div className="flex flex-wrap gap-2">
                    <Link href="/ingresar" className="font-semibold text-accent underline">Ingresar</Link>
                    <Link href="/proyectos" className="font-semibold text-accent underline">Ver todos los proyectos</Link>
                </div>
            </Card>
        );
    }

    return <ListadoProyectos cuentaGit={perfil.cuentaGit} />;
};

export default BuscarProyecto
