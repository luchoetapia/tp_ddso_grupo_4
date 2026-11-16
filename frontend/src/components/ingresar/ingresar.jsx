'use client'

import { useLayoutEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import { Button, InputContrasena } from '@/components/common'

const Ingresar = () => {
    const [accessKey, setAccessKey] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);
    
    useLayoutEffect(() => () => {
        setAccessKey('');
        setPassword('');
        setCargando(false);
    }, []);
    const router = useRouter();

    const ingresarUsuario = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
            // Si falla, apiQuery ya muestra la alerta con el error
            const data = await apiQuery.post('/auth/login', { accessKey, password }, { mensajeError: 'No se pudo ingresar.' });
             router.push(data.usuario.rol === 'colaborador' ? '/colaboradoras/inicio' : '/buscar-colaboradoras');
            return data.usuario;
        } catch {
            setCargando(false);
            return null;
        }
    };

    const estiloLabel = 'flex flex-col gap-[3px] text-[13px] text-muted';
    const estiloControl = 'w-full rounded-[10px] border border-border bg-bg p-2.5 text-[15px] text-text';

    return (
        <section className="flex w-full flex-col justify-center gap-3 rounded-[14px] border border-border bg-card p-[18px] shadow-[0_1px_2px_rgba(22,48,43,0.06)]">
            <h2 className="text-[18px] font-semibold text-text">Ingresar</h2>
            <form onSubmit={ingresarUsuario} className="flex flex-col gap-2">
                <label className={estiloLabel}>Usuario o email:
                    <input type="text" name="accessKey" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} required autoComplete="username" className={estiloControl} />
                </label>
                <InputContrasena label="Contraseña:" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                <Button type="submit" variant="primary" cargando={cargando} className="mt-1 hover:opacity-90">
                    {cargando ? 'Ingresando…' : 'Ingresar'}
                </Button>
            </form>
        </section>
    );
};

export default Ingresar;
