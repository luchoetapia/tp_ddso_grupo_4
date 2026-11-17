'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import { Button, Card, Checkbox, Paginacion, Skeleton } from '@/components/common'
import TarjetaProyecto from '@/components/proyectos/TarjetaProyecto'
import FiltroHabilidades from '@/components/proyectos/FiltroHabilidades'

// 24 completa filas con 1, 2, 3 y 4 columnas (mobile, tablet, desktop, pantallas xxl)
const POR_PAGINA = 24;
const ESPERA_BUSQUEDA_MS = 400;

const leerFiltros = (params) => ({
    texto: params.get('texto') ?? '',
    habilidades: params.get('habilidades')?.split(',').filter(Boolean) ?? [],
    pagina: Math.max(1, Number(params.get('pagina')) || 1),
    misHabilidades: params.get('misHabilidades') === '1',
});

// Los filtros viven en la URL: se pueden compartir y el botón "atrás" los respeta
const armarQuery = ({ texto, habilidades, pagina, misHabilidades }) => {
    const params = new URLSearchParams();
    if (misHabilidades) params.set('misHabilidades', '1');
    if (texto.trim()) params.set('texto', texto.trim());
    if (habilidades.length) params.set('habilidades', habilidades.join(','));
    if (pagina > 1) params.set('pagina', String(pagina));
    return params.toString();
};

// Solo proyectos en curso. Con "Solo mis habilidades" (colaborador logueado) se usan los proyectos
// cuyos perfiles abiertos piden habilidades que la persona tiene.
// Sin alerta: si falla, la página muestra su propio aviso.
const pedirProyectos = ({ texto, habilidades, pagina, misHabilidades }, cuentaGit, signal) => apiQuery.get(
    misHabilidades && cuentaGit
        ? `/colaboradores/${encodeURIComponent(cuentaGit)}/buscarPotencialesProyectos`
        : '/proyectos',
    {
        params: {
            texto: texto.trim() || undefined,
            habilidades: habilidades.length ? habilidades.join(',') : undefined,
            finalizado: false,
            pagina,
            limite: POR_PAGINA,
        },
        signal,
        alertarError: false,
    }
);

const pedirHabilidades = (signal) =>
    apiQuery.get('/habilidades', { params: { limite: 100, orden: 'titulo', direccion: 'asc' }, signal, alertarError: false });

const subirAlListado = () => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('listado-proyectos')?.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' });
};

// cuentaGit: solo para el colaborador logueado (views/proyectos/BuscarProyecto); habilita "Solo mis habilidades"
const ListadoProyectos = ({ cuentaGit = null }) => {
    const router = useRouter();
    const ruta = usePathname();
    const params = useSearchParams();
    const filtros = leerFiltros(params);
    const query = armarQuery(filtros);

    const [textoEscrito, setTextoEscrito] = useState(filtros.texto);
    const [textoUrl, setTextoUrl] = useState(filtros.texto);
    const [intento, setIntento] = useState(0);
    // "clave" identifica la consulta que generó el resultado: si no coincide con la actual, está cargando
    const [resultado, setResultado] = useState({ clave: null, error: false, datos: null });
    const [habilidades, setHabilidades] = useState({ cargando: true, lista: [] });

    // Si el texto de la URL cambia por fuera del input (botón "atrás", link desde la home), se copia al input
    if (filtros.texto !== textoUrl) {
        setTextoUrl(filtros.texto);
        if (textoEscrito.trim() !== filtros.texto) setTextoEscrito(filtros.texto);
    }

    const claveActual = `${query}#${intento}`;
    const cargando = resultado.clave !== claveActual;

    const navegar = (cambios) => {
        const destino = armarQuery({ ...filtros, pagina: 1, ...cambios });
        router.replace(destino ? `${ruta}?${destino}` : ruta, { scroll: false });
    };

    // Proyectos: se piden cada vez que cambian los filtros de la URL
    useEffect(() => {
        const controlador = new AbortController();
        pedirProyectos(leerFiltros(new URLSearchParams(query)), cuentaGit, controlador.signal)
            .then((datos) => setResultado({ clave: claveActual, error: false, datos }))
            .catch((err) => {
                if (!err.cancelado) setResultado({ clave: claveActual, error: true, datos: null });
            });
        return () => controlador.abort();
    }, [query, claveActual, cuentaGit]);

    // Habilidades para el filtro: se piden una sola vez
    useEffect(() => {
        const controlador = new AbortController();
        pedirHabilidades(controlador.signal)
            .then(({ data }) => setHabilidades({ cargando: false, lista: data }))
            .catch((err) => {
                if (!err.cancelado) setHabilidades({ cargando: false, lista: [] });
            });
        return () => controlador.abort();
    }, []);

    // Búsqueda por texto: espera a que se deje de escribir para no pedir en cada tecla
    useEffect(() => {
        if (textoEscrito.trim() === filtros.texto.trim()) return;
        const espera = setTimeout(() => navegar({ texto: textoEscrito }), ESPERA_BUSQUEDA_MS);
        return () => clearTimeout(espera);
    });

    const hayFiltros = Boolean(filtros.texto || filtros.habilidades.length);
    const limpiar = () => {
        setTextoEscrito('');
        navegar({ texto: '', habilidades: [] });
    };

    const cambiarPagina = (pagina) => {
        navegar({ pagina });
        subirAlListado();
    };

    const proyectos = resultado.datos?.data ?? [];
    const paginacion = resultado.datos?.paginacion;
    const total = paginacion?.total ?? 0;

    return (
        <section aria-labelledby="titulo-proyectos" className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1">
                <h1 id="titulo-proyectos" className="m-0">Proyectos</h1>
                <p className="m-0 text-muted">
                    Proyectos en curso de colectivos que buscan colaboradores. Los proyectos finalizados no se muestran.
                </p>
            </div>

            <Card className="gap-3.5">
                <form
                    role="search"
                    aria-label="Buscar proyectos"
                    onSubmit={(e) => { e.preventDefault(); navegar({ texto: textoEscrito }); }}
                    className="flex items-center gap-2 rounded-full border border-border bg-bg py-1 pr-1 pl-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 text-muted">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                        type="search"
                        name="texto"
                        value={textoEscrito}
                        onChange={(e) => setTextoEscrito(e.target.value)}
                        placeholder="Buscar por nombre o habilidad"
                        aria-label="Buscar por nombre o habilidad"
                        className="min-w-0 flex-1 border-0 bg-transparent py-2 outline-none"
                    />
                    {textoEscrito && (
                        <Button variant="link" onClick={() => { setTextoEscrito(''); navegar({ texto: '' }); }}>
                            Borrar
                        </Button>
                    )}
                </form>

                {cuentaGit && (
                    <Checkbox
                        label="Solo proyectos que buscan mis habilidades"
                        checked={filtros.misHabilidades}
                        onChange={(e) => navegar({ misHabilidades: e.target.checked })}
                        className="min-h-10 text-[14px] text-text"
                    />
                )}

                <FiltroHabilidades
                    habilidades={habilidades.lista}
                    seleccionadas={filtros.habilidades}
                    cargando={habilidades.cargando}
                    onCambiar={(seleccionadas) => navegar({ habilidades: seleccionadas })}
                />

                <div className="flex flex-wrap items-center gap-2">
                    <p className="m-0 flex-1 text-[13px] text-muted" role="status">
                        {cargando ? 'Buscando proyectos…' : `${total} ${total === 1 ? 'proyecto en curso' : 'proyectos en curso'}`}
                    </p>
                    {hayFiltros && <Button variant="link" onClick={limpiar}>Limpiar filtros</Button>}
                </div>
            </Card>

            <div id="listado-proyectos" aria-busy={cargando} className="flex scroll-mt-20 flex-col gap-[18px]">
                {cargando && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[250px] rounded-[14px]" />)}
                    </div>
                )}

                {!cargando && resultado.error && (
                    <Card role="alert" className="items-start">
                        <p className="m-0">No pudimos cargar los proyectos.</p>
                        <Button onClick={() => setIntento((n) => n + 1)}>Reintentar</Button>
                    </Card>
                )}

                {!cargando && !resultado.error && proyectos.length === 0 && (
                    <Card className="items-center py-7 text-center">
                        {hayFiltros ? (
                            <>
                                <h2 className="m-0 font-sans text-[17px] font-bold">No encontramos proyectos con esos filtros</h2>
                                <p className="m-0 text-muted">Probá con otra palabra o quitá alguna habilidad.</p>
                                <Button onClick={limpiar}>Limpiar filtros</Button>
                            </>
                        ) : (
                            <p className="m-0 text-muted">Todavía no hay proyectos en curso.</p>
                        )}
                    </Card>
                )}

                {!cargando && !resultado.error && proyectos.length > 0 && (
                    <>
                        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                            {proyectos.map((proyecto) => (
                                <li key={proyecto.id} className="flex [&>article]:flex-1">
                                    <TarjetaProyecto proyecto={proyecto} />
                                </li>
                            ))}
                        </ul>
                        <Paginacion {...paginacion} onCambiar={cambiarPagina} nombre="proyectos" />
                    </>
                )}
            </div>
        </section>
    );
};

export default ListadoProyectos
