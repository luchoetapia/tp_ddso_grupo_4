'use client'

import { useId } from 'react'
import { Button, Card, Checkbox, Input, Select, Textarea } from '@/components/common'

export const PERIODOS = [
    { valor: 'semanal', texto: 'por semana' },
    { valor: 'mensual', texto: 'por mes' },
    { valor: 'total', texto: 'en total' },
];

let ultimaClave = 0;

export const perfilVacio = () => ({
    clave: ++ultimaClave,
    titulo: '',
    descripcion: '',
    habilidadesRequeridas: [],
    habilidadesOpcionales: [],
    cantHoras: '',
    periodo: 'semanal',
    incentivoEconomico: '',
    posibleContratacion: false,
    busquedaAbierta: true,
    limiteColaboraciones: '',
    fechaFinBusqueda: '',
});

export const perfilDesdeApi = (perfil) => {
    const fecha = perfil.fechaFinBusqueda ? String(perfil.fechaFinBusqueda).slice(0, 10) : '';
    return {
        ...perfilVacio(),
        id: perfil.id,
        titulo: perfil.titulo ?? '',
        descripcion: perfil.descripcion ?? '',
        habilidadesRequeridas: (perfil.habilidadesRequeridas ?? []).map((h) => h.id),
        habilidadesOpcionales: (perfil.habilidadesOpcionales ?? []).map((h) => h.id),
        cantHoras: perfil.tipoCompromiso?.cantHoras != null ? String(perfil.tipoCompromiso.cantHoras) : '',
        periodo: perfil.tipoCompromiso?.periodo ?? 'semanal',
        incentivoEconomico: perfil.modalidadColaboracion?.incentivoEconomico ? String(perfil.modalidadColaboracion.incentivoEconomico) : '',
        posibleContratacion: Boolean(perfil.modalidadColaboracion?.posibleContratacion),
        busquedaAbierta: perfil.busquedaAbierta !== false,
        limiteColaboraciones: perfil.limiteColaboraciones != null ? String(perfil.limiteColaboraciones) : '',
        fechaFinBusqueda: fecha,
        fechaGuardada: fecha, // una fecha ya vencida que no se tocó no es un error
    };
};

const hoy = () => new Date().toISOString().slice(0, 10);

export const validarPerfil = (perfil) => {
    const errores = {};
    if (!perfil.titulo.trim()) errores.titulo = 'Poné un título al perfil.';
    if (!perfil.descripcion.trim()) errores.descripcion = 'Describí qué va a hacer esta persona.';
    if (perfil.habilidadesRequeridas.length === 0) errores.habilidadesRequeridas = 'Elegí al menos una habilidad requerida.';
    if (!(Number(perfil.cantHoras) > 0)) errores.cantHoras = 'Indicá una cantidad de horas mayor a 0.';
    if (perfil.incentivoEconomico !== '' && !(Number(perfil.incentivoEconomico) >= 0)) {
        errores.incentivoEconomico = 'El incentivo no puede ser negativo.';
    }
    if (perfil.limiteColaboraciones !== '' && !(Number.isInteger(Number(perfil.limiteColaboraciones)) && Number(perfil.limiteColaboraciones) > 0)) {
        errores.limiteColaboraciones = 'El límite debe ser un número entero mayor a 0.';
    }
    if (perfil.fechaFinBusqueda && perfil.fechaFinBusqueda !== perfil.fechaGuardada && perfil.fechaFinBusqueda < hoy()) {
        errores.fechaFinBusqueda = 'La fecha no puede ser anterior a hoy.';
    }
    return errores;
};

// formato API
export const perfilParaEnviar = (perfil) => ({
    titulo: perfil.titulo.trim(),
    descripcion: perfil.descripcion.trim(),
    habilidadesRequeridas: perfil.habilidadesRequeridas,
    habilidadesOpcionales: perfil.habilidadesOpcionales,
    tipoCompromiso: { cantHoras: Number(perfil.cantHoras), periodo: perfil.periodo },
    modalidadColaboracion: {
        incentivoEconomico: perfil.incentivoEconomico === '' ? 0 : Number(perfil.incentivoEconomico),
        posibleContratacion: perfil.posibleContratacion,
    },
    busquedaAbierta: perfil.busquedaAbierta,
    // null borra el valor guardado al editar
    limiteColaboraciones: perfil.limiteColaboraciones === '' ? null : Number(perfil.limiteColaboraciones),
    fechaFinBusqueda: perfil.fechaFinBusqueda || null,
});

const SelectorHabilidades = ({ etiqueta, ayuda, habilidades, seleccionadas, deshabilitadas = [], onChange, error }) => {
    const id = useId();

    const alternar = (idHabilidad) =>
        onChange(seleccionadas.includes(idHabilidad)
            ? seleccionadas.filter((s) => s !== idHabilidad)
            : [...seleccionadas, idHabilidad]);

    return (
        <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" aria-describedby={`${id}-ayuda`}>
            <legend className="p-0 text-[13px] font-semibold">
                {etiqueta} <span className="font-normal text-muted">({seleccionadas.length} elegidas)</span>
            </legend>
            <p id={`${id}-ayuda`} className="m-0 text-[13px] text-muted">{ayuda}</p>
            <div className="flex flex-wrap gap-2">
                {habilidades.map((h) => {
                    const elegida = seleccionadas.includes(h.id);
                    const bloqueada = deshabilitadas.includes(h.id);
                    return (
                        <button
                            key={h.id}
                            type="button"
                            aria-pressed={elegida}
                            disabled={bloqueada}
                            title={bloqueada ? 'Ya está elegida en la otra lista' : h.descripcion}
                            onClick={() => alternar(h.id)}
                            className={`min-h-9 cursor-pointer rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${elegida ? 'border-accent bg-accent text-on-accent' : 'border-border bg-card text-text hover:border-muted'}`}
                        >
                            {h.titulo}
                        </button>
                    );
                })}
            </div>
            {error && <p role="alert" className="m-0 text-[13px] text-error">{error}</p>}
        </fieldset>
    );
};

const FormularioPerfil = ({ perfil, numero, habilidades, errores = {}, onChange, onQuitar }) => {
    const campo = (nombre) => ({
        name: nombre,
        value: perfil[nombre],
        error: errores[nombre],
        onChange: (e) => onChange(nombre, e.target.value),
    });

    return (
        <Card as="fieldset" className="m-0 min-w-0 gap-4">
            <legend className="sr-only">Perfil {numero}</legend>
            <div className="flex items-center justify-between gap-3">
                <h3 className="m-0 font-sans text-[17px] font-bold" aria-hidden="true">
                    Perfil {numero}{perfil.titulo.trim() && `: ${perfil.titulo.trim()}`}
                </h3>
                <Button variant="danger" onClick={onQuitar}>
                    Quitar<span className="sr-only"> perfil {numero}</span>
                </Button>
            </div>

            <Input label="Título del perfil" placeholder="Ej.: Tester, Analista de datos" {...campo('titulo')} required />
            <Textarea label="Descripción" rows={3} placeholder="¿Qué tareas va a realizar?" {...campo('descripcion')} required />

            <SelectorHabilidades
                etiqueta="Habilidades requeridas"
                ayuda="Las personas tienen que tener todas para encajar en el perfil."
                habilidades={habilidades}
                seleccionadas={perfil.habilidadesRequeridas}
                deshabilitadas={perfil.habilidadesOpcionales}
                onChange={(lista) => onChange('habilidadesRequeridas', lista)}
                error={errores.habilidadesRequeridas}
            />
            <SelectorHabilidades
                etiqueta="Habilidades opcionales"
                ayuda="Suman, pero no son obligatorias."
                habilidades={habilidades}
                seleccionadas={perfil.habilidadesOpcionales}
                deshabilitadas={perfil.habilidadesRequeridas}
                onChange={(lista) => onChange('habilidadesOpcionales', lista)}
            />

            <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                <Input label="Horas de compromiso" type="number" min="1" inputMode="numeric" {...campo('cantHoras')} required />
                <Select label="Período" {...campo('periodo')}>
                    {PERIODOS.map(({ valor, texto }) => <option key={valor} value={valor}>{texto}</option>)}
                </Select>
                <Input
                    label="Incentivo económico en $ (opcional)"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="Vacío o 0: sin incentivo"
                    {...campo('incentivoEconomico')}
                />
                <Input
                    label="Límite de colaboraciones (opcional)"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    placeholder="Vacío: sin límite"
                    {...campo('limiteColaboraciones')}
                />
                <Input
                    label="Búsqueda abierta hasta (opcional)"
                    type="date"
                    min={hoy()}
                    {...campo('fechaFinBusqueda')}
                />
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Checkbox
                    label="Posibilidad de contratación eventual"
                    checked={perfil.posibleContratacion}
                    onChange={(e) => onChange('posibleContratacion', e.target.checked)}
                />
                <Checkbox
                    label="Búsqueda abierta (se aceptan postulaciones)"
                    checked={perfil.busquedaAbierta}
                    onChange={(e) => onChange('busquedaAbierta', e.target.checked)}
                />
            </div>
        </Card>
    );
};

export default FormularioPerfil
