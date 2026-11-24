import Link from 'next/link'
import { Checkbox, Input } from '@/components/common'

const tipos = [
    {
        valor: 'colaborador',
        titulo: 'Colaborador',
        descripcion: 'Sumate a proyectos de colectivos según tus habilidades.',
        icono: 'M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12',
    },
    {
        valor: 'colectivo',
        titulo: 'Colectivo',
        descripcion: 'Publicá proyectos de tu organización y buscá colaboradores.',
        icono: 'M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6',
    },
];

const EMAIL_VALIDO = /^\S+@\S+\.\S+$/;

// Checkbox de términos y condiciones (también lo usa el registro con LinkedIn, que saltea este paso)
export const CheckboxTerminos = ({ acepta, onChange }) => (
    <Checkbox
        name="aceptaTerminos"
        checked={!!acepta}
        onChange={(e) => onChange(e.target.checked)}
        className="min-h-11 gap-2.5 [&_input]:h-5 [&_input]:w-5"
        label={<span className="text-[16px] text-text">Acepto los <Link href="#" className="font-semibold text-accent underline">términos y condiciones</Link></span>}
    />
);

const PasoTipoCuenta = ({ usuario, onChange }) => {
    const email = usuario.email ?? '';
    const emailInvalido = email.length > 0 && !EMAIL_VALIDO.test(email);
    return (
        <div className="flex flex-col gap-[18px]">
            <h2 className="m-0 text-[24px]">¿Cómo querés participar?</h2>

            <div role="group" aria-label="Tipo de cuenta" className="grid gap-3 sm:grid-cols-2">
                {tipos.map(({ valor, titulo, descripcion, icono }) => {
                    const elegido = usuario.rol === valor;
                    return (
                        <button
                            key={valor}
                            type="button"
                            aria-pressed={elegido}
                            onClick={() => onChange('rol', valor)}
                            className={`relative flex cursor-pointer flex-col items-start gap-2 rounded-[14px] border-2 p-4 text-left transition-colors ${elegido ? 'border-accent bg-accent/10' : 'border-border bg-card hover:border-muted'}`}
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d={icono} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                            <span className="text-[17px] font-bold text-text">{titulo}</span>
                            <span className="text-[14px] text-muted">{descripcion}</span>
                            <span aria-hidden="true" className={`absolute top-3.5 right-3.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${elegido ? 'border-accent bg-accent text-on-accent' : 'border-border bg-card'}`}>
                                {elegido && (
                                    <svg width="12" height="12" viewBox="0 0 24 24">
                                        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-2.5">
                <Input
                    label="Nombre de usuario"
                    name="username"
                    value={usuario.username ?? ''}
                    onChange={(e) => onChange('username', e.target.value)}
                    autoComplete="username"
                    minLength={3}
                    required
                />
                <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => onChange('email', e.target.value)}
                    autoComplete="email"
                    error={emailInvalido ? 'Ingresá un email válido, por ejemplo nombre@dominio.com.' : undefined}
                    required
                />
            </div>

            <CheckboxTerminos acepta={usuario.aceptaTerminos} onChange={(valor) => onChange('aceptaTerminos', valor)} />
        </div>
    );
};

export default PasoTipoCuenta;
