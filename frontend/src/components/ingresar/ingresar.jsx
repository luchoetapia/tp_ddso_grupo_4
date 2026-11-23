'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import apiQuery from '@/services/api/apiQuery'
import alertas from '@/services/alertas'
import { INICIO_POR_ROL } from '@/services/sesion'
import { BotonLinkedin, Button, InputContrasena, SeparadorO } from '@/components/common'

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
    const errorLinkedin = useSearchParams().get('errorLinkedin');
    const errorMostrado = useRef(false);

    // Si el ingreso con LinkedIn falló, la API redirige acá con ?errorLinkedin=<mensaje>:
    // se muestra la alerta y se limpia la URL (así no reaparece al recargar)
    useEffect(() => {
        if (!errorLinkedin || errorMostrado.current) return;
        errorMostrado.current = true;
        alertas.error(errorLinkedin);
        router.replace('/ingresar');
    }, [errorLinkedin, router]);

    const ingresarUsuario = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
            // Si falla, apiQuery ya muestra la alerta con el error
            const data = await apiQuery.post('/auth/login', { accessKey, password }, { mensajeError: 'No se pudo ingresar.' });
            router.push(INICIO_POR_ROL[data.usuario.rol] ?? '/');
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
            <SeparadorO />
            <BotonLinkedin />
            <p className="m-0 text-center text-[12px] text-muted">Solo para colaboradores</p>
        </section>
    );
};

export default Ingresar;
