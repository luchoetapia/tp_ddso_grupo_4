import Link from 'next/link'
import { Card } from '@/components/common'

// Card que se muestra al terminar el registro
const RegistroExitoso = ({ nombre, rol }) => {
    return (
        <Card role="status" className="items-center gap-3 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            <h1 className="m-0 text-[clamp(26px,4vw,34px)]">¡Bienvenido, {nombre}!</h1>
            <p className="m-0 max-w-[420px] text-muted">
                Te registraste como <strong className="font-semibold text-text">{rol}</strong>. Iniciá sesión para poder empezar.
            </p>
            <Link
                href="/ingresar"
                className="mt-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-accent bg-accent px-[22px] py-2 font-semibold text-on-accent hover:opacity-90"
            >
                Ir a ingreso
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </Link>
        </Card>
    );
};

export default RegistroExitoso;
