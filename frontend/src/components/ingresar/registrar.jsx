'use client'

import { useState } from 'react'
import apiQuery from '@/services/api/apiQuery'
import alertas from '@/services/alertas'

const Registrar = () => {
  const [tipoRegistro, setTipoRegistro] = useState('Colectivo');

  const [nombreOrg, setNombreOrg] = useState('');
  const [tipoOrg, setTipoOrg] = useState('');
  const [descripcionOrg, setDescripcionOrg] = useState('');
  const [ubicacionOrg, setUbicacionOrg] = useState('');

  const [nombreColaborador, setNombreColaborador] = useState('');
  const [apellidoColaborador, setApellidoColaborador] = useState('');
  const [nombreFantasia, setNombreFantasia] = useState('');
  const [cuentaGitColaborador, setCuentaGitColaborador] = useState('');
  const [pronombres, setPronombres] = useState('');
  const [presentacion, setPresentacion] = useState('');
  const [deseaSerContactado, setDeseaSerContactado] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const registrarUsuario = async (rol) => {
    // Si falla, apiQuery ya muestra la alerta con el error
    try {
        await apiQuery.post('/auth/registro', { username, email, password, rol }, { mensajeError: 'No se pudo crear el usuario.' });
        return true;
    } catch {
        return false;
    }
  };

  const registrarColectivo = async (e) => {
    e.preventDefault();
    if (!(await registrarUsuario('colectivo'))) return;

    try {
        await apiQuery.post('/colectivos', {
            nombre: nombreOrg,
            tipo: tipoOrg,
            descripcion: descripcionOrg,
            ubicacion: ubicacionOrg,
        }, { mensajeError: 'No se pudo registrar la organización.' });
        alertas.exito('Organización registrada exitosamente');
    } catch {
        // apiQuery ya mostró la alerta de error
    }
    };

    const registrarColaborador = async (e) => {
        e.preventDefault();
        if (!(await registrarUsuario('colaborador'))) return;

        try {
            await apiQuery.post('/colaboradores', {
                nombre: nombreColaborador,
                apellido: apellidoColaborador,
                nombreFantasia: nombreFantasia || undefined,
                cuentaGit: cuentaGitColaborador,
                pronombres: pronombres || undefined,
                presentacion: presentacion || undefined,
                deseaSerContactado: deseaSerContactado,
            }, { mensajeError: 'No se pudo registrar el colaborador.' });
            alertas.exito('Colaborador registrado exitosamente');
        } catch {
            // apiQuery ya mostró la alerta de error
        }
    };

  const estiloLabel = 'flex flex-col gap-[3px] text-[13px] text-muted';
  const estiloControl = 'w-full rounded-[10px] border border-border bg-bg p-2.5 text-[15px] text-text';
  const estiloRadio = 'inline-flex cursor-pointer items-center gap-1.5';

  const camposCuenta = (
    <>
        <label className={estiloLabel}>Usuario:
            <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} autoComplete="username" className={estiloControl} />
        </label>
        <label className={estiloLabel}>Email:
            <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={estiloControl} />
        </label>
        <label className={estiloLabel}>Contraseña:
            <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={estiloControl} />
        </label>
    </>
  );

  return (
    <section className="mx-auto flex w-full max-w-[440px] flex-col gap-3 rounded-[14px] border border-border bg-card p-[18px] shadow-[0_1px_2px_rgba(22,48,43,0.06)]">
        <div className="flex gap-4 text-[14px] text-muted">
            <label className={estiloRadio}>
                <input type="radio" name="selectoColectivoOColaborador" value="Colectivo" checked={tipoRegistro === 'Colectivo'} onChange={(e) => setTipoRegistro(e.target.value)} className="accent-accent" /> Colectivo
            </label>
            <label className={estiloRadio}>
                <input type="radio" name="selectoColectivoOColaborador" value="Colaborador" checked={tipoRegistro === 'Colaborador'} onChange={(e) => setTipoRegistro(e.target.value)} className="accent-accent" /> Colaborador
            </label>
        </div>

        {tipoRegistro === 'Colectivo' ? (
        <form onSubmit={registrarColectivo} className="flex flex-col gap-2">
            {camposCuenta}
            <label className={estiloLabel}>Nombre de la organización:
                <input type="text" name="nombreOrg" value={nombreOrg} onChange={(e) => setNombreOrg(e.target.value)} className={estiloControl} />
            </label>
            <label className={estiloLabel}> Tipo de organización:
                <select onChange={(e) => setTipoOrg(e.target.value)} value={tipoOrg} name="tipoOrg" required className={estiloControl}>
                    <option value="">Elegí un tipo</option>
                    <option value="fundacion">Fundación</option>
                    <option value="asociacion_barrial">Asociación Barrial</option>
                    <option value="ong">ONG</option>
                    <option value="asamblea">Asamblea</option>
                </select>

            </label>
            <label className={estiloLabel}>Descripción de la organización:
                <input type="text" name="descripcionOrg" value={descripcionOrg} onChange={(e) => setDescripcionOrg(e.target.value)} className={estiloControl} />
            </label>
            <label className={estiloLabel}>Ubicación de la organización:
                <input type="text" name="ubicacionOrg" value={ubicacionOrg} onChange={(e) => setUbicacionOrg(e.target.value)} className={estiloControl} />
            </label>
            <button type="submit" className="mt-1 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-accent bg-accent px-[18px] py-2 font-semibold text-on-accent hover:opacity-90">
                Registrar Organización
            </button>
        </form>
        ) : (
        <form onSubmit={registrarColaborador} className="flex flex-col gap-2">
            {camposCuenta}
            <label className={estiloLabel}>Nombre:
                <input type="text" name="nombreColaborador" value={nombreColaborador} onChange={(e) => setNombreColaborador(e.target.value)} required className={estiloControl} />
            </label>
            <label className={estiloLabel}>Apellido:
                <input type="text" name="apellidoColaborador" value={apellidoColaborador} onChange={(e) => setApellidoColaborador(e.target.value)} required className={estiloControl} />
            </label>
            <label className={estiloLabel}>Nombre de fantasía:
                <input type="text" name="nombreFantasia" value={nombreFantasia} onChange={(e) => setNombreFantasia(e.target.value)} className={estiloControl} />
            </label>
            <label className={estiloLabel}>Cuenta de Git:
                <input type="text" name="cuentaGitColaborador" value={cuentaGitColaborador} onChange={(e) => setCuentaGitColaborador(e.target.value)} required className={estiloControl} />
            </label>
            <label className={estiloLabel}>Pronombres:
                <input type="text" name="pronombres" value={pronombres} onChange={(e) => setPronombres(e.target.value)} className={estiloControl} />
            </label>
            <label className={estiloLabel}>Presentación:
                <textarea name="presentacion" value={presentacion} onChange={(e) => setPresentacion(e.target.value)} maxLength={300} className={estiloControl} />
            </label>
            <label className={estiloRadio + ' text-[14px] text-muted'}>
                <input type="checkbox" name="deseaSerContactado" checked={deseaSerContactado} onChange={(e) => setDeseaSerContactado(e.target.checked)} className="accent-accent" /> Deseo ser contactado/a
            </label>
            <button type="submit" className="mt-1 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-accent bg-accent px-[18px] py-2 font-semibold text-on-accent hover:opacity-90">
                Registrar Colaborador
            </button>
        </form>
        )}
    </section>
  );
};

export default Registrar;