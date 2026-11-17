'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

const HeroInicio = () => {
    const router = useRouter();

    // Lleva al listado de proyectos con la búsqueda aplicada
    const buscarProyectos = (e) => {
        e.preventDefault();
        const texto = new FormData(e.currentTarget).get('busqueda')?.toString().trim();
        router.push(texto ? `/proyectos?texto=${encodeURIComponent(texto)}` : '/proyectos');
    }

    return (
        <section
            aria-labelledby="hero-titulo"
            className="flex flex-col gap-3.5 rounded-[22px] bg-accent px-7 py-10 text-on-accent"
        >
            <p className="text-[12px] font-bold tracking-[0.12em] uppercase">Software libre con propósito</p>
            <h1 id="hero-titulo" className="m-0">Tu código puede mover a un colectivo</h1>
            <p className="m-0">
                Conectamos colectivos que necesitan software con personas que quieren aportar su tiempo y sus habilidades.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
                <Link
                    href="/registro"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-highlight bg-highlight px-6 py-2.5 text-[16px] font-semibold text-[#16302b] shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
                >
                    Crear cuenta gratis
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
                <Link
                    href="/proyectos"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/70 px-[22px] py-2.5 font-semibold text-on-accent"
                >
                    Ver proyectos
                </Link>
            </div>

            <p className="m-0 text-[13px] opacity-90">
                Colectivos: publicá tu proyecto y encontrá quién lo construya · Colaboradores: sumate a proyectos que buscan tus habilidades
            </p>

            <form
                role="search"
                aria-label="Buscar proyectos"
                onSubmit={buscarProyectos}
                className="mt-1.5 flex w-full flex-wrap gap-2 rounded-full bg-white/[0.12] p-1.5"
            >
                <input
                    type="search"
                    name="busqueda"
                    placeholder="Buscar proyectos por nombre o habilidad"
                    aria-label="Buscar proyectos por nombre o habilidad"
                    className="min-w-[200px] flex-1 rounded-full border-0 bg-white px-4 py-2.5 text-[#16302b]"
                />
                <button
                    type="submit"
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-[#16302b] bg-[#16302b] px-[18px] py-2 font-semibold text-white"
                >
                    Buscar
                </button>
            </form>
        </section>
    )
}

export default HeroInicio
