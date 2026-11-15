'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'

const Ingresar = () => {
    const [accessKey, setAccessKey] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const ingresarUsuario = async (e) => {
        e.preventDefault();

        try {
            // Si falla, apiQuery ya muestra la alerta con el error
            const data = await apiQuery.post('/auth/login', { accessKey, password }, { mensajeError: 'No se pudo ingresar.' });
            router.push('/');
            return data.usuario;
        } catch {
            return null;
        }
    };

    const estiloLabel = 'flex flex-col gap-[3px] text-[13px] text-muted';
    const estiloControl = 'w-full rounded-[10px] border border-border bg-bg p-2.5 text-[15px] text-text';

    return (
        <section className="mx-auto flex w-full max-w-[440px] flex-col gap-3 rounded-[14px] border border-border bg-card p-[18px] shadow-[0_1px_2px_rgba(22,48,43,0.06)]">
            <h2 className="text-[18px] font-semibold text-text">Ingresar</h2>
            <form onSubmit={ingresarUsuario} className="flex flex-col gap-2">
                <label className={estiloLabel}>Usuario o email:
                    <input type="text" name="accessKey" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} required autoComplete="username" className={estiloControl} />
                </label>
                <label className={estiloLabel}>Contraseña:
                    <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className={estiloControl} />
                </label>
                <button type="submit" className="mt-1 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-accent bg-accent px-[18px] py-2 font-semibold text-on-accent hover:opacity-90">
                    Ingresar
                </button>
            </form>
        </section>
    );
};

export default Ingresar;
