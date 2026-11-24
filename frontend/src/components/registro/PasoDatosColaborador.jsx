import { useEffect, useState } from 'react'
import { Checkbox, Input, Skeleton, Textarea } from '@/components/common'
import apiQuery from '@/services/api/apiQuery'

// Mismo formato que valida la API (colaboradoresValidator)
export const REGEX_CUENTA_GIT = /^[a-zA-Z0-9._-]{1,39}$/;
const MAX_PRESENTACION = 300;

// Etiquetas para agrupar las habilidades según su tipo
const TITULOS_TIPO = {
    programacion: 'Programación',
    diseño: 'Diseño',
    marketing: 'Marketing',
    comunicacion: 'Comunicación',
    gestion_proyectos: 'Gestión de proyectos',
    colaboracion: 'Colaboración',
};

const agruparPorTipo = (habilidades) =>
    Object.entries(
        habilidades.reduce((grupos, h) => ({ ...grupos, [h.tipoHabilidad]: [...(grupos[h.tipoHabilidad] ?? []), h] }), {})
    );

const SelectorHabilidades = ({ seleccionadas, onChange }) => {
    const [habilidades, setHabilidades] = useState(null);

    useEffect(() => {
        // apiQuery ya muestra la alerta si falla; el listado de habilidades es público
        apiQuery
            .get('/habilidades', { params: { limite: 100 }, mensajeError: 'No se pudieron cargar las habilidades.' })
            .then(({ data }) => setHabilidades(data))
            .catch(() => setHabilidades([]));
    }, []);

    const alternar = (id) =>
        onChange(seleccionadas.includes(id) ? seleccionadas.filter((s) => s !== id) : [...seleccionadas, id]);

    return (
        <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
            <legend className="p-0 text-[13px] text-muted">
                Tus habilidades <span aria-hidden="true">({seleccionadas.length} elegidas)</span>
            </legend>

            {habilidades === null && (
                <div className="flex flex-col gap-2" aria-busy="true">
                    <Skeleton />
                    <Skeleton />
                </div>
            )}

            {habilidades?.length === 0 && (
                <p className="m-0 text-[13px] text-muted">No hay habilidades disponibles por el momento.</p>
            )}

            {habilidades && agruparPorTipo(habilidades).map(([tipo, lista]) => {
                const cantidadSeleccionada = lista.filter((h) => seleccionadas.includes(h.id)).length;

                return (
                    <details
                        key={tipo}
                        className="rounded-[10px] border border-border bg-bg p-2.5"
                        open={cantidadSeleccionada > 0}
                    >
                        <summary className="cursor-pointer rounded-md px-1 py-1 text-[13px] font-bold uppercase tracking-wide text-muted">
                            <span>{TITULOS_TIPO[tipo] ?? tipo}</span>
                            <span className="ml-2 normal-case text-accent">
                                ({cantidadSeleccionada} seleccionadas)
                            </span>
                        </summary>

                        <div className="mt-2 flex flex-wrap gap-2">
                            {lista.map((h) => {
                                const elegida = seleccionadas.includes(h.id);

                                return (
                                    <button
                                        key={h.id}
                                        type="button"
                                        aria-pressed={elegida}
                                        title={h.descripcion}
                                        onClick={() => alternar(h.id)}
                                        className={`min-h-9 cursor-pointer rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors ${
                                            elegida
                                                ? 'border-accent bg-accent text-on-accent'
                                                : 'border-border bg-card text-text hover:border-muted'
                                        }`}
                                    >
                                        {h.titulo}
                                    </button>
                                );
                            })}
                        </div>
                    </details>
                );
            })}
        </fieldset>
    );
};

const PasoDatosColaborador = ({ colaborador, onChange, titulo = 'Contanos sobre vos', cuentaGitEditable = true }) => {
    const cuentaGit = colaborador.cuentaGit ?? '';
    const presentacion = colaborador.presentacion ?? '';
    const errorCuentaGit = cuentaGit && !REGEX_CUENTA_GIT.test(cuentaGit)
        ? 'Solo letras, números, punto, guion o guion bajo.'
        : undefined;

    const campo = (nombre) => ({
        name: nombre,
        value: colaborador[nombre] ?? '',
        onChange: (e) => onChange(nombre, e.target.value),
    });

    return (
        <div className="flex flex-col gap-[18px]">
            {titulo && <h2 className="m-0 text-[24px]">{titulo}</h2>}

            <p className="m-0 text-[13px] text-muted">
                Podés mantenerte anónima con un nombre de fantasía, o usar tu nombre real. Necesitamos al menos uno de los dos.
            </p>

            <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                <Input label="Nombre de fantasía" {...campo('nombreFantasia')} />
                <Input label="Pronombres (opcional)" {...campo('pronombres')} placeholder="él, ella, otro" />
                <Input label="Nombre (opcional si tenés nombre de fantasía)" {...campo('nombre')} autoComplete="given-name" />
                <Input label="Apellido (opcional)" {...campo('apellido')} autoComplete="family-name" />
            </div>

            {cuentaGitEditable ? (
                <Input label="Cuenta de Git" {...campo('cuentaGit')} error={errorCuentaGit} required />
            ) : (
                <div className="flex flex-col gap-1">
                    <Input label="Cuenta de Git" value={cuentaGit} readOnly aria-describedby="ayuda-cuenta-git" />
                    <p id="ayuda-cuenta-git" className="m-0 text-[12px] text-muted">La cuenta de Git te identifica en la plataforma y no se puede cambiar.</p>
                </div>
            )}

            <SelectorHabilidades
                seleccionadas={colaborador.habilidades ?? []}
                onChange={(ids) => onChange('habilidades', ids)}
            />

            <div className="flex flex-col gap-1">
                <Textarea label="Presentación (opcional)" {...campo('presentacion')} maxLength={MAX_PRESENTACION} rows={4} />
                <span className="self-end text-[12px] text-muted">{presentacion.length}/{MAX_PRESENTACION}</span>
            </div>

            <Checkbox
                name="deseaSerContactado"
                checked={!!colaborador.deseaSerContactado}
                onChange={(e) => onChange('deseaSerContactado', e.target.checked)}
                className="min-h-11 gap-2.5 [&_input]:h-5 [&_input]:w-5"
                label={<span className="text-[16px] text-text">Acepto que los colectivos me contacten</span>}
            />
        </div>
    );
};

export default PasoDatosColaborador;