'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import alertas from '@/services/alertas'
import { Button, Card, Paginacion, Select, Skeleton } from '@/components/common'
import TarjetaColaborador from '@/components/colaboradores/TarjetaColaborador'
import ContactarColaboradora from './ContactarColaboradora'

// 12 completa filas con 1, 2 y 3 columnas (mobile, tablet, desktop)
const POR_PAGINA = 12;

// Opciones de orden: clave del <select> → { orden, direccion } que entiende la API
const ORDENES = {
    'cuentaGit-asc': { texto: 'Usuario de GitHub (A–Z)', orden: 'cuentaGit', direccion: 'asc' },
    'cuentaGit-desc': { texto: 'Usuario de GitHub (Z–A)', orden: 'cuentaGit', direccion: 'desc' },
    'nombre-asc': { texto: 'Nombre (A–Z)', orden: 'nombre', direccion: 'asc' },
    'nombre-desc': { texto: 'Nombre (Z–A)', orden: 'nombre', direccion: 'desc' },
};
const ORDEN_POR_DEFECTO = 'cuentaGit-asc';

const leerFiltros = (params) => ({
    proyectos: params.get('proyectos')?.split(',').filter(Boolean) ?? [],
    orden: Object.hasOwn(ORDENES, params.get('orden') ?? '') ? params.get('orden') : ORDEN_POR_DEFECTO,
    pagina: Math.max(1, Number(params.get('pagina')) || 1),
});

// Los filtros viven en la URL: se pueden compartir y el botón "atrás" los respeta
const armarQuery = ({ proyectos, orden, pagina }) => {
    const params = new URLSearchParams();
    if (proyectos.length) params.set('proyectos', proyectos.join(','));
    if (orden !== ORDEN_POR_DEFECTO) params.set('orden', orden);
    if (pagina > 1) params.set('pagina', String(pagina));
    return params.toString();
};

// Sin alerta: si falla, la página muestra su propio aviso
const pedirColaboradores = ({ proyectos, orden, pagina }, signal) => apiQuery.get('/colectivos/me/potencialesColaboradores', {
    params: {
        proyectos: proyectos.length ? proyectos.join(',') : undefined,
        orden: ORDENES[orden].orden,
        direccion: ORDENES[orden].direccion,
        pagina,
        limite: POR_PAGINA,
    },
    signal,
    alertarError: false,
});

const subirAlListado = () => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('listado-colaboradores')?.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' });
};

const estiloChip = 'inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3.5 py-1.5 text-[14px] font-semibold';
const chip = (activo) => `${estiloChip} ${activo ? 'border-accent bg-accent text-on-accent' : 'border-border bg-card text-text'}`;

const BuscarColaboradoras = () => {
    const router = useRouter();
    const ruta = usePathname();
    const params = useSearchParams();
    const filtros = leerFiltros(params);
    const query = armarQuery(filtros);

    const [intento, setIntento] = useState(0);
    // "clave" identifica la consulta que generó el resultado: si no coincide con la actual, está cargando
    const [resultado, setResultado] = useState({ clave: null, error: false, datos: null });
    const [proyectos, setProyectos] = useState([]);
    const [aContactar, setAContactar] = useState(null);

    const claveActual = `${query}#${intento}`;
    const cargando = resultado.clave !== claveActual;

    const navegar = (cambios) => {
        const destino = armarQuery({ ...filtros, pagina: 1, ...cambios });
        router.replace(destino ? `${ruta}?${destino}` : ruta, { scroll: false });
    };

    // Colaboradores: se piden cada vez que cambian los filtros de la URL
    useEffect(() => {
        const controlador = new AbortController();
        pedirColaboradores(leerFiltros(new URLSearchParams(query)), controlador.signal)
            .then((datos) => setResultado({ clave: claveActual, error: false, datos }))
            .catch((err) => {
                if (err.cancelado) return;
                // Un id de proyecto que ya no es del colectivo (link viejo): se vuelve a buscar en todos
                if (err.status === 404 && query.includes('proyectos=')) {
                    router.replace(ruta, { scroll: false });
                    return;
                }
                setResultado({ clave: claveActual, error: true, datos: null });
            });
        return () => controlador.abort();
    }, [query, claveActual, router, ruta]);

    // Proyectos del colectivo para el filtro: solo los en curso con algún perfil abierto. Se piden una vez
    useEffect(() => {
        const controlador = new AbortController();
        apiQuery
            .get('/colectivos/me', { signal: controlador.signal, alertarError: false })
            .then((colectivo) => setProyectos(colectivo.proyectos.filter((p) => !p.finalizado && p.perfilesAbiertos > 0)))
            .catch((err) => {
                if (!err.cancelado && err.status === 403) router.replace('/');
            });
        return () => controlador.abort();
    }, [router]);

    const alternarProyecto = (id) => navegar({
        proyectos: filtros.proyectos.includes(id)
            ? filtros.proyectos.filter((x) => x !== id)
            : [...filtros.proyectos, id],
    });

    const cambiarPagina = (pagina) => {
        navegar({ pagina });
        subirAlListado();
    };

    const alEnviar = (texto) => {
        setAContactar(null);
        alertas.exito(texto);
    };

    const colaboradores = resultado.datos?.data ?? [];
    const paginacion = resultado.datos?.paginacion;
    const total = paginacion?.total ?? 0;
    const hayFiltroProyectos = filtros.proyectos.length > 0;

    return (
        <section aria-labelledby="titulo-colaboradores" className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1">
                <h1 id="titulo-colaboradores" className="m-0">Buscar colaboradores</h1>
                <p className="m-0 text-muted">
                    Personas cuyas habilidades cumplen los requisitos de algún perfil con búsqueda abierta de tus proyectos en curso.
                </p>
            </div>

            <Card className="gap-3.5">
                {proyectos.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <span id="filtro-proyectos" className="text-[12px] font-bold tracking-[.1em] text-muted uppercase">
                            Proyectos
                        </span>
                        <div role="group" aria-labelledby="filtro-proyectos" className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                aria-pressed={!hayFiltroProyectos}
                                onClick={() => navegar({ proyectos: [] })}
                                className={chip(!hayFiltroProyectos)}
                            >
                                Todos
                            </button>
                            {proyectos.map((p) => {
                                const elegido = filtros.proyectos.includes(p.id);
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        aria-pressed={elegido}
                                        onClick={() => alternarProyecto(p.id)}
                                        className={chip(elegido)}
                                    >
                                        {p.titulo}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-end gap-3">
                    <p className="m-0 flex-1 text-[13px] text-muted" role="status">
                        {cargando
                            ? 'Buscando colaboradores…'
                            : `${total} ${total === 1 ? 'colaborador compatible' : 'colaboradores compatibles'}`}
                    </p>
                    <Select label="Ordenar por" value={filtros.orden} onChange={(e) => navegar({ orden: e.target.value })}>
                        {Object.entries(ORDENES).map(([clave, { texto }]) => (
                            <option key={clave} value={clave}>{texto}</option>
                        ))}
                    </Select>
                </div>
            </Card>

            <div id="listado-colaboradores" aria-busy={cargando} className="flex scroll-mt-20 flex-col gap-[18px]">
                {cargando && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[230px] rounded-[14px]" />)}
                    </div>
                )}

                {!cargando && resultado.error && (
                    <Card role="alert" className="items-start">
                        <p className="m-0">No pudimos cargar los colaboradores.</p>
                        <Button onClick={() => setIntento((n) => n + 1)}>Reintentar</Button>
                    </Card>
                )}

                {!cargando && !resultado.error && colaboradores.length === 0 && (
                    <Card className="items-center py-7 text-center">
                        {hayFiltroProyectos ? (
                            <>
                                <h2 className="m-0 font-sans text-[17px] font-bold">No encontramos colaboradores para estos proyectos</h2>
                                <p className="m-0 text-muted">Probá con otro proyecto, o revisá que sus perfiles tengan la búsqueda abierta.</p>
                                <Button onClick={() => navegar({ proyectos: [] })}>Ver todos los proyectos</Button>
                            </>
                        ) : (
                            <p className="m-0 text-muted">
                                Todavía no hay colaboradores que encajen con los perfiles abiertos de tus proyectos.
                            </p>
                        )}
                    </Card>
                )}

                {!cargando && !resultado.error && colaboradores.length > 0 && (
                    <>
                        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
                            {colaboradores.map((colaborador) => (
                                <li key={colaborador.id} className="flex [&>article]:flex-1">
                                    <TarjetaColaborador colaborador={colaborador} onEnviarMensaje={setAContactar} />
                                </li>
                            ))}
                        </ul>
                        <Paginacion {...paginacion} onCambiar={cambiarPagina} nombre="colaboradores" />
                    </>
                )}
            </div>

            {aContactar && (
                <ContactarColaboradora
                    colaboradora={aContactar}
                    onCerrar={() => setAContactar(null)}
                    onEnviado={alEnviar}
                />
            )}
        </section>
    );
};

export default BuscarColaboradoras
