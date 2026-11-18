'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import apiQuery from '@/services/api/apiQuery';
import alertas from '@/services/alertas';
import sesion, { roles } from '@/services/sesion';
import { Button, Card, Modal, ProgressBar, Skeleton, Tag, Textarea } from '@/components/common';
import { formatearFecha, formatearMoneda } from '@/helpers/formatos';

const varianteEstado = { Pendiente: 'highlight', Aceptada: 'accent', Rechazada: 'neutral' };
const grilla = 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3';

export default function VerProyectoContenido() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [proyecto, setProyecto] = useState(null);
    const [cargando, setCargando] = useState(Boolean(id));
    const [error, setError] = useState(null);

    // Contexto de usuario colaborador y postulaciones
    const [usuario, setUsuario] = useState(null);
    const [colaborador, setColaborador] = useState(null);
    const [postulaciones, setPostulaciones] = useState({});

    // Modal de postulación
    const [perfilAPostular, setPerfilAPostular] = useState(null);
    const [mensajePostulacion, setMensajePostulacion] = useState('');
    const [enviandoPostulacion, setEnviandoPostulacion] = useState(false);

    const [colaboraciones, setColaboraciones] = useState([]);


    useEffect(() => {
        if (!id) return;

        const controlador = new AbortController();

        apiQuery
            .get(`/proyectos/${id}`, {
                signal: controlador.signal,
                alertarError: false,
                mensajeError: 'No se pudo cargar el proyecto.',
            })
            .then((data) => setProyecto(data))
            .catch((err) => {
                if (!err.cancelado) setError(err.mensaje ?? 'No se encontró el proyecto.');
            })

        apiQuery
            .get(`/colaboraciones/proyecto/${id}`, {
                signal: controlador.signal,
                alertarError: false,
                mensajeError: 'No se pudo cargar las colaboraciones',
            })
            .then((data) => setColaboraciones(data))
            .catch((err) => {
                if (!err.cancelado) setError(err.mensaje ?? 'No se encontraron las colaboraciones.');
            })
            .finally(() => setCargando(false));

        return () => controlador.abort();
    }, [id]);

    useEffect(() => {
        const cargarDatosColaborador = async () => {
            try {
                const user = await sesion.obtenerUsuario();
                setUsuario(user);

                if (user && user.rol === roles.COLABORADOR) {
                    const colab = await apiQuery.get('/colaboradores/me', { alertarError: false });
                    setColaborador(colab);

                    const misPostulaciones = await apiQuery.get('/postulaciones', {
                        params: { idColaborador: colab.id, idProyecto: id },
                        alertarError: false,
                    });

                    const mapeo = {};
                    [...misPostulaciones]
                        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                        .forEach((p) => {
                            mapeo[p.idPerfil] = p.estado;
                        });
                    setPostulaciones(mapeo);
                }
            } catch {
                // Si falla o no está logueado como colaborador, simplemente no se habilitan las acciones de postulación
            }
        };

        if (id) {
            cargarDatosColaborador();
        }
    }, [id]);

    const abrirModalPostulacion = (perfil) => {
        setPerfilAPostular(perfil);
        setMensajePostulacion('');
    };

    const cerrarModalPostulacion = () => {
        if (!enviandoPostulacion) {
            setPerfilAPostular(null);
            setMensajePostulacion('');
        }
    };

    const enviarPostulacion = async () => {
        if (!perfilAPostular || !colaborador) return;
        setEnviandoPostulacion(true);

        try {
            const data = await apiQuery.post(
                '/postulaciones',
                {
                    idProyecto: proyecto.id,
                    idPerfil: perfilAPostular.id,
                    cuentaGit: colaborador.cuentaGit,
                    mensaje: mensajePostulacion.trim(),
                },
                { mensajeError: 'No se pudo enviar la postulación.' }
            );

            setPostulaciones((prev) => ({
                ...prev,
                [perfilAPostular.id]: data?.estado ?? 'Pendiente',
            }));

            alertas.exito(`Te postulaste al perfil "${perfilAPostular.titulo}".`);
            cerrarModalPostulacion();
        } catch {
            // apiQuery ya alerta en caso de error
        } finally {
            setEnviandoPostulacion(false);
        }
    };

    if (cargando) {
        return (
            <section aria-busy="true" className="flex flex-col gap-4">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
            </section>
        );
    }

    if (error || !proyecto) {
        return (
            <Card role="alert" className="items-start">
                <p className="m-0 text-error">{error ?? 'No se encontró el proyecto solicitado.'}</p>
                <Link href="/proyectos" className="text-sm underline text-muted">
                    ← Volver a proyectos
                </Link>
            </Card>
        );
    }

    const {
        titulo,
        descripcion,
        finalizado,
        porcentajeFinalizado,
        enlaceSistema,
        enlaceCodigoFuente,
        perfiles = [],
        logros = [],
    } = proyecto;

    return (
        <section className="flex flex-col gap-6" aria-labelledby="proyecto-titulo">
            {/* Cabecera del Proyecto */}
            <header className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href="/proyectos" className="text-[13px] text-muted underline">
                        ← Volver a proyectos
                    </Link>
                    <div className="flex flex-wrap gap-2">
                        {finalizado ? (
                            <Tag variant="neutral">Proyecto finalizado</Tag>
                        ) : (
                            <Tag variant="accent">Proyecto en curso</Tag>
                        )}
                    </div>
                </div>

                <h1 id="proyecto-titulo" className="m-0 text-3xl font-bold">
                    {titulo}
                </h1>
                <Card>
                    <p className="m-0 text-base leading-relaxed text-muted whitespace-pre-line">
                        {descripcion}
                    </p>

                    {/* Enlaces externos */}
                    {(enlaceSistema || enlaceCodigoFuente) && (
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            {enlaceSistema && (
                                <a
                                    href={enlaceSistema}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-[18px] py-2 text-sm font-semibold text-text transition-colors hover:border-accent"
                                >
                                    Ver sistema en vivo ↗
                                </a>
                            )}
                            {enlaceCodigoFuente && (
                                <a
                                    href={enlaceCodigoFuente}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-[18px] py-2 text-sm font-semibold text-text transition-colors hover:border-accent"
                                >
                                    Código fuente ↗
                                </a>
                            )}
                        </div>
                    )}
                </Card>
            </header>
            <section aria-labelledby="numeros-titulo" className="flex flex-col gap-3">
                <div className={grilla}>
                    <Card className="gap-0.5">
                        <span className="font-display text-[38px] leading-[1.1] font-bold text-accent">
                            {porcentajeFinalizado ?? 0}%
                        </span>
                        <span className="font-semibold">Del proyecto finalizado</span>
                        <ProgressBar value={porcentajeFinalizado} label="Avance general" />
                    </Card>
                    <Card className="gap-0.5">
                        <span className="font-display text-[38px] leading-[1.1] font-bold text-accent">
                            {logros.length ?? 0}
                        </span>
                        <span className="font-semibold">Logros alcanzados</span>
                    </Card>
                    <Card className="gap-0.5">
                        <span className="font-display text-[38px] leading-[1.1] font-bold text-accent">
                            {colaboraciones.length ?? 0}
                        </span>
                        <span className="font-semibold">Colaboraciones activas</span>
                    </Card>
                </div>
                
            </section>
            {/* Perfiles buscados */}
            <section aria-labelledby="seccion-perfiles" className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 id="seccion-perfiles" className="m-0 text-2xl font-bold">
                        Perfiles buscados
                    </h2>
                    <span className="text-sm text-muted">
                        {perfiles.length} {perfiles.length === 1 ? 'perfil' : 'perfiles'}
                    </span>
                </div>

                {perfiles.length === 0 ? (
                    <Card className="items-center text-center">
                        <p className="m-0 text-muted">Este proyecto no tiene perfiles registrados.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {perfiles.map((perfil) => {
                            const estadoPostulacion = postulaciones[perfil.id];
                            const puedePostularse =
                                usuario?.rol === roles.COLABORADOR &&
                                perfil.busquedaAbierta &&
                                !finalizado;

                            return (
                                <Card key={perfil.id} as="article" className="flex flex-col justify-between gap-3">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <h3 className="m-0 text-lg font-bold">{perfil.titulo}</h3>
                                            <div className="flex flex-wrap gap-1.5">
                                                {perfil.busquedaAbierta ? (
                                                    <Tag variant="accent">Búsqueda abierta</Tag>
                                                ) : (
                                                    <Tag variant="neutral">Búsqueda cerrada</Tag>
                                                )}
                                            </div>
                                        </div>

                                        {perfil.descripcion && (
                                            <p className="m-0 text-sm text-muted whitespace-pre-line">
                                                {perfil.descripcion}
                                            </p>
                                        )}

                                        {/* Habilidades requeridas */}
                                        {perfil.habilidadesRequeridas?.length > 0 && (
                                            <div className="flex flex-col gap-1 pt-1">
                                                <span className="text-xs font-semibold text-muted uppercase">
                                                    Requeridas:
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {perfil.habilidadesRequeridas.map((hab) => (
                                                        <Tag key={hab.id ?? hab.titulo} variant="highlight">
                                                            {hab.titulo}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Habilidades opcionales */}
                                        {perfil.habilidadesOpcionales?.length > 0 && (
                                            <div className="flex flex-col gap-1 pt-1">
                                                <span className="text-xs font-semibold text-muted uppercase">
                                                    Deseables:
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {perfil.habilidadesOpcionales.map((hab) => (
                                                        <Tag key={hab.id ?? hab.titulo} variant="neutral">
                                                            {hab.titulo}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Detalles de compromiso y modalidad */}
                                        <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg bg-sf/60 p-3 text-xs sm:grid-cols-2">
                                            {perfil.tipoCompromiso?.cantHoras && (
                                                <div>
                                                    <span className="font-semibold text-muted">Dedicación: </span>
                                                    <span>
                                                        {perfil.tipoCompromiso.cantHoras} hs{' '}
                                                        {perfil.tipoCompromiso.periodo ?? ''}
                                                    </span>
                                                </div>
                                            )}

                                            {perfil.modalidadColaboracion && (
                                                <div>
                                                    <span className="font-semibold text-muted">Compensación: </span>
                                                    <span>
                                                        {perfil.modalidadColaboracion.incentivoEconomico > 0
                                                            ? formatearMoneda(perfil.modalidadColaboracion.incentivoEconomico)
                                                            : 'Ad honorem'}
                                                    </span>
                                                </div>
                                            )}

                                            {perfil.modalidadColaboracion?.posibleContratacion && (
                                                <div className="sm:col-span-2">
                                                    <Tag variant="accent">Posibilidad de contratación</Tag>
                                                </div>
                                            )}

                                            {perfil.limiteColaboraciones && (
                                                <div>
                                                    <span className="font-semibold text-muted">Vacantes: </span>
                                                    <span>{perfil.limiteColaboraciones}</span>
                                                </div>
                                            )}

                                            {perfil.fechaFinBusqueda && (
                                                <div>
                                                    <span className="font-semibold text-muted">Cierre de búsqueda: </span>
                                                    <span>{formatearFecha(perfil.fechaFinBusqueda)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Acción o estado de postulación */}
                                    <div className="mt-2 border-t border-border pt-3">
                                        {estadoPostulacion ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Tag variant={varianteEstado[estadoPostulacion] ?? 'neutral'}>
                                                    Postulación {estadoPostulacion.toLowerCase()}
                                                </Tag>
                                                {estadoPostulacion === 'Rechazada' && puedePostularse && (
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => abrirModalPostulacion(perfil)}
                                                    >
                                                        Volver a postularme
                                                    </Button>
                                                )}
                                            </div>
                                        ) : puedePostularse ? (
                                            <Button
                                                variant="primary"
                                                onClick={() => abrirModalPostulacion(perfil)}
                                            >
                                                Postularme
                                            </Button>
                                        ) : !usuario ? (
                                            <span className="text-xs text-muted">
                                                <Link href="/ingresar" className="font-semibold underline">
                                                    Iniciá sesión
                                                </Link>{' '}
                                                como colaboradora para postularte.
                                            </span>
                                        ) : null}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Logros alcanzados */}
            <section aria-labelledby="seccion-logros" className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 id="seccion-logros" className="m-0 text-2xl font-bold">
                        Logros e hitos
                    </h2>
                    <span className="text-sm text-muted">
                        {logros.length} {logros.length === 1 ? 'logro' : 'logros'}
                    </span>
                </div>

                {logros.length === 0 ? (
                    <Card className="items-center text-center">
                        <p className="m-0 text-muted">Todavía no se publicaron logros para este proyecto.</p>
                    </Card>
                ) : (
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                        {logros.map((logro) => (
                            <Card as="li" key={logro.id} className="gap-1.5">
                                <div className="flex items-center gap-2">
                                    <span aria-hidden="true" className="text-lg">🏆</span>
                                    <h3 className="m-0 text-base font-bold">{logro.titulo}</h3>
                                </div>
                                <p className="m-0 text-sm text-muted whitespace-pre-line">
                                    {logro.descripcion}
                                </p>
                            </Card>
                        ))}
                    </ul>
                )}
            </section>
            <section aria-labelledby="seccion-colaboradores" className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 id="seccion-colaboraciones" className="m-0 text-2xl font-bold">
                        Colaboraciones
                    </h2>
                    <span className="text-sm text-muted">
                        {colaboraciones.length} {colaboraciones.length === 1 ? 'colaboracion' : 'colaboraciones'}
                    </span>
                </div>

                {colaboraciones.length === 0 ? (
                    <Card className="items-center text-center">
                        <p className="m-0 text-muted">Todavía no hay colaboradores.</p>
                    </Card>
                ) : (
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                        {colaboraciones.map((colaboracion) => (
                            <Card as="li" key={colaboracion.id} className="gap-1.5">
                                <div className="flex items-center gap-2">
                                    <h3 className="m-0 text-base font-bold">{colaboracion.colaborador.nombre}  {colaboracion.colaborador.apellido}</h3>
                                </div>
                            </Card>
                        ))}
                    </ul>
                )}
            </section>

            {/* Modal de confirmación y mensaje de postulación */}
            <Modal
                open={perfilAPostular !== null}
                onClose={cerrarModalPostulacion}
                title={`Postularse a "${perfilAPostular?.titulo}"`}
                footer={
                    <>
                        <Button onClick={cerrarModalPostulacion} disabled={enviandoPostulacion}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={enviarPostulacion}
                            cargando={enviandoPostulacion}
                        >
                            Confirmar postulación
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-3">
                    <p className="m-0 text-sm text-muted">
                        Podés adjuntar un mensaje de presentación o contar tus motivaciones para sumarte al colectivo en este perfil.
                    </p>
                    <Textarea
                        label="Mensaje (opcional)"
                        value={mensajePostulacion}
                        onChange={(e) => setMensajePostulacion(e.target.value)}
                        placeholder="Hola, me interesa participar porque..."
                        rows={4}
                        disabled={enviandoPostulacion}
                    />
                </div>
            </Modal>
        </section>
    );
}
