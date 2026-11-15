import { Checkbox, Input, Textarea } from '@/components/common'

// Mismo formato que valida la API (colaboradoresValidator)
export const REGEX_CUENTA_GIT = /^[a-zA-Z0-9._-]{1,39}$/;
const MAX_PRESENTACION = 300;

const PasoDatosColaborador = ({ colaborador, onChange }) => {
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
            <h2 className="m-0 text-[24px]">Contanos sobre vos</h2>

            <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                <Input label="Nombre" {...campo('nombre')} autoComplete="given-name" required />
                <Input label="Apellido" {...campo('apellido')} autoComplete="family-name" required />
                <Input label="Nombre de fantasía (opcional)" {...campo('nombreFantasia')} />
                <Input label="Pronombres (opcional)" {...campo('pronombres')} placeholder="él, ella, otro" />
            </div>

            <Input label="Cuenta de Git" {...campo('cuentaGit')} error={errorCuentaGit} required />

            <div className="flex flex-col gap-1">
                <Textarea label="Presentación (opcional)" {...campo('presentacion')} maxLength={MAX_PRESENTACION} rows={4} />
                <span className="self-end text-[12px] text-muted">{presentacion.length}/{MAX_PRESENTACION}</span>
            </div>

            <Checkbox
                name="deseaSerContactado"
                checked={!!colaborador.deseaSerContactado}
                onChange={(e) => onChange('deseaSerContactado', e.target.checked)}
                className="min-h-11"
                label={<span className="text-[14px] text-text">Acepto que los colectivos me contacten</span>}
            />
        </div>
    );
};

export default PasoDatosColaborador;
