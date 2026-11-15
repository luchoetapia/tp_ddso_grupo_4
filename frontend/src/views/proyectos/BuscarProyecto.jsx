'use client'

import { useState } from 'react'
import apiQuery from '@/services/api/apiQuery'

const BuscarProyecto = () => {

    const [texto, setTexto] = useState('');
    const [soloMisHabilidades, setSoloMisHabilidades] = useState(false);
    const [proyectos, setProyectos] = useState([]);
    // TEMPORAL: hasta que haya un endpoint que devuelva el colaborador logueado
    const [cuentaGit, setCuentaGit] = useState('');

    const busquedaNormal = async (e) => {
        e.preventDefault();

        // Si falla, apiQuery ya muestra la alerta con el error
        try {
            return await apiQuery.get('/proyectos', { params: { texto }, mensajeError: 'No se pudieron buscar los proyectos.' });
        } catch {
            return [];
        }
    }

    const buscarProyectos = async (e) => {
        const encontrados = soloMisHabilidades
            ? await busquedaPorHabilidades(e)
            : await busquedaNormal(e);
        setProyectos(encontrados);
    }

    const busquedaPorHabilidades = async (e) => {
        e.preventDefault();

        let data;
        try {
            data = await apiQuery.get(
                `/colaboradores/${encodeURIComponent(cuentaGit)}/buscarPotencialesProyectos`,
                { mensajeError: 'No se pudieron buscar los proyectos.' }
            );
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

    return (
        <section className="card">
            <h3 className="text-[18px] font-semibold">Proyectos</h3>
            <div className="flex gap-4 text-muted">
                <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar proyecto..." className="input" /> 
                <input type="checkbox" checked={soloMisHabilidades} onChange={(e) => setSoloMisHabilidades(e.target.checked)} className="input" /> Solo mis habilidades
                {soloMisHabilidades && (
                    <input type="text" value={cuentaGit} onChange={(e) => setCuentaGit(e.target.value)} placeholder="Tu cuenta de Git (temporal)" className="input" />
                )}
                <button className="btn" onClick={buscarProyectos}>
                    Buscar
                </button>
            </div>

            <ul className="flex flex-col gap-2">
                {proyectos.map((proyecto) => (
                    <li key={proyecto.id}>
                        <strong>{proyecto.titulo}</strong>: {proyecto.descripcion}
                    </li>
                ))}
            </ul>
        </section>
    )
}

export default BuscarProyecto