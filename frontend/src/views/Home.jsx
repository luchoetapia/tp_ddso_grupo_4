'use client'

import { useEffect, useState } from 'react'
import apiQuery from '@/services/api/apiQuery'
import HeroInicio from '@/components/home/HeroInicio'
import ContadoresPlataforma from '@/components/home/ContadoresPlataforma'
import ProyectosDestacados from '@/components/home/ProyectosDestacados'

const pedirContadores = (signal) => apiQuery.get('/home/contadores', { signal, alertarError: false });
const pedirDestacados = (signal) => apiQuery.get('/home/destacados', { signal, alertarError: false });

const INICIAL = { cargando: true, error: false, datos: null };

const useConsulta = (consultar) => {
    const [estado, setEstado] = useState(INICIAL);
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        const controlador = new AbortController();
        consultar(controlador.signal)
            .then((datos) => setEstado({ cargando: false, error: false, datos }))
            .catch((err) => {
                if (!err.cancelado) setEstado({ cargando: false, error: true, datos: null });
            });
        return () => controlador.abort();
    }, [consultar, intento]);

    const reintentar = () => {
        setEstado(INICIAL);
        setIntento((n) => n + 1);
    };

    return { ...estado, reintentar };
};

export default function Home() {
    // Las consultas se disparan en paralelo y cada sección carga a su ritmo
    const contadores = useConsulta(pedirContadores);
    const destacados = useConsulta(pedirDestacados);

    return (
        <>
            <HeroInicio />
            <ContadoresPlataforma {...contadores} />
            <ProyectosDestacados {...destacados} />
        </>
    );
}
