import { InputContrasena } from '@/components/common'

export const LARGO_MINIMO_CONTRASENA = 8;

const PasoContrasena = ({ usuario, onChange }) => {
    const password = usuario.password ?? '';
    const repetida = usuario.repeat_password ?? '';

    const requisitos = [
        { texto: `Al menos ${LARGO_MINIMO_CONTRASENA} caracteres`, ok: password.length >= LARGO_MINIMO_CONTRASENA },
        { texto: 'Las dos contraseñas coinciden', ok: password.length > 0 && password === repetida },
    ];

    return (
        <div className="flex flex-col gap-[18px]">
            <h2 className="m-0 text-[24px]">Elegí una contraseña</h2>

            <div className="flex flex-col gap-2.5">
                <InputContrasena
                    label="Contraseña"
                    name="password"
                    value={password}
                    onChange={(e) => onChange('password', e.target.value)}
                    autoComplete="new-password"
                    minLength={LARGO_MINIMO_CONTRASENA}
                    required
                />
                <InputContrasena
                    label="Repetir contraseña"
                    name="repeat_password"
                    value={repetida}
                    onChange={(e) => onChange('repeat_password', e.target.value)}
                    autoComplete="new-password"
                    required
                />
            </div>

            <ul aria-live="polite" className="m-0 flex list-none flex-col gap-1.5 rounded-[10px] bg-bg px-3.5 py-3">
                {requisitos.map(({ texto, ok }) => (
                    <li key={texto} className={`flex items-center gap-2 text-[13px] ${ok ? 'text-accent' : 'text-muted'}`}>
                        <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full transition-colors ${ok ? 'bg-accent text-on-accent' : 'bg-border'}`}>
                            {ok && (
                                <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </span>
                        {texto}
                        <span className="sr-only">{ok ? '(cumplido)' : '(pendiente)'}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PasoContrasena;
