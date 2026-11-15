import Link from 'next/link'

const roles = [
    {
        titulo: 'Colectivo',
        descripcion: 'publicá proyectos y buscá colaboradores.',
        icono: 'M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6',
    },
    {
        titulo: 'Colaborador',
        descripcion: 'sumate a proyectos según tus habilidades.',
        icono: 'M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12',
    },
];

const InvitacionRegistro = () => {
    return (
        <section className="flex flex-col justify-center gap-3.5 rounded-[14px] bg-accent p-7 text-on-accent">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] opacity-80">¿Primera vez por acá?</p>
            <h2 className="text-[26px] leading-[1.15]">¿Todavía no tenés una cuenta?</h2>
            <p className="opacity-90">Creala en un par de pasos y elegí cómo querés participar.</p>

            <ul className="flex flex-col gap-2">
                {roles.map(({ titulo, descripcion, icono }) => (
                    <li key={titulo} className="flex items-start gap-2.5 rounded-[10px] bg-on-accent/10 px-3 py-2.5 text-[14px]">
                        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="mt-px shrink-0">
                            <path d={icono} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span><strong className="font-bold">{titulo}</strong> — {descripcion}</span>
                    </li>
                ))}
            </ul>

            {/* Texto oscuro fijo: el amarillo es igual en modo claro y oscuro */}
            <Link href="/registro" className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full bg-highlight px-5 py-2.5 font-bold text-[#16302b] hover:opacity-90 max-md:self-stretch">
                Registrate aquí
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </Link>
        </section>
    );
};

export default InvitacionRegistro;
