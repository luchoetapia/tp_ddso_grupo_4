'use client'

import { useEffect, useLayoutEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import apiQuery from "@/services/api/apiQuery"
import alertas from "@/services/alertas"
import sesion, { roles } from "@/services/sesion"
import Link from "next/link"
import { BotonLinkedin, Button, Card, SeparadorO } from "@/components/common"
import LineaDePasos from "@/components/registro/LineaDePasos"
import PasoTipoCuenta, { CheckboxTerminos } from "@/components/registro/PasoTipoCuenta"
import PasoContrasena, { LARGO_MINIMO_CONTRASENA } from "@/components/registro/PasoContrasena"
import PasoDatosColaborador, { REGEX_CUENTA_GIT } from "@/components/registro/PasoDatosColaborador"
import PasoDatosColectivo from "@/components/registro/PasoDatosColectivo"
import RegistroExitoso from "@/components/registro/RegistroExitoso"

const modelo_usuario = {
    username: null,
    password: null,
    repeat_password: null,
    email: null,
    rol: null,
    aceptaTerminos: false
}

const modelo_colaborador = {
    usuario: null,
    nombre: null,
    apellido: null,
    nombreFantasia: null,
    pronombres: null,
    cuentaGit: null,
    presentacion: null,
    deseaSerContactado: false,
    habilidades: []
}

const modelo_colectivo = {
    usuario: null,
    nombre: null,
    tipo: null,
    ubicacion: null,
    descripcion: null
}

export function Registro() {
    const [usuario, setUsuario] = useState(modelo_usuario);
    const [colaborador, setColaborador] = useState(modelo_colaborador);
    const [colectivo, setColectivo] = useState(modelo_colectivo);
    const [paso, setPaso] = useState(1);
    const [registrado, setRegistrado] = useState(false);
    const router = useRouter();

    // Viene del callback de LinkedIn: el usuario ya existe y tiene la sesión iniciada,
    // solo falta completar los datos del colaborador (paso 3)
    const esLinkedin = useSearchParams().get('origen') === 'linkedin';
    const [cargandoLinkedin, setCargandoLinkedin] = useState(esLinkedin);

    const CANT_PASOS = 3;

    const sinVacios = (datos) =>
        Object.fromEntries(Object.entries(datos).filter(([, valor]) => valor !== null && valor !== ''));

    const actualizar = (setter) => (campo, valor) =>
        setter((anterior) => ({ ...anterior, [campo]: valor }));
    const actualizarUsuario = actualizar(setUsuario);
    const actualizarColaborador = actualizar(setColaborador);
    const actualizarColectivo = actualizar(setColectivo);

    const esColectivo = usuario.rol === 'colectivo';
    const nombresPasos = esLinkedin
        ? ['Tipo de cuenta', 'LinkedIn', 'Tus datos']
        : ['Tipo de cuenta', 'Contraseña', esColectivo ? 'Datos del colectivo' : 'Tus datos'];

    const lleno = (valor) => typeof valor === 'string' && valor.trim() !== '';

    // Habilita "Siguiente" solo si el paso actual está completo
    const pasoCompleto = () => {
        if (paso === 1) {
            return Boolean(usuario.rol)
                && (usuario.username ?? '').trim().length >= 3
                && /^\S+@\S+\.\S+$/.test(usuario.email ?? '')
                && usuario.aceptaTerminos;
        }
        if (paso === 2) {
            return (usuario.password ?? '').length >= LARGO_MINIMO_CONTRASENA
                && usuario.password === usuario.repeat_password;
        }
        if (esColectivo) return lleno(colectivo.nombre) && lleno(colectivo.tipo);
        return (lleno(colaborador.nombre) || lleno(colaborador.nombreFantasia))
            && REGEX_CUENTA_GIT.test(colaborador.cuentaGit ?? '')
            && colaborador.habilidades.length > 0
            // Con LinkedIn el paso 1 se salteó: los términos se aceptan acá
            && (!esLinkedin || usuario.aceptaTerminos);
    };

    // Con LinkedIn los pasos 1 y 2 ya están hechos (la cuenta existe): no se puede volver
    const puedoVolverAtras = () => paso > 1 && !esLinkedin;
    const handlerAtras = () => setPaso((anterior) => anterior - 1);

    const registrar = async (e) => {
        e?.preventDefault();

        if (usuario.password !== usuario.repeat_password) {
            alertas.error('Las contraseñas no coinciden.');
            return false;
        }

        const esColectivo = usuario.rol === 'colectivo';
        const perfil = esColectivo ? colectivo : colaborador;
        const setPerfil = esColectivo ? setColectivo : setColaborador;

        try {
            // Si un intento anterior ya creó el usuario (y falló el perfil), no se vuelve a registrar: daría 409
            let idUsuario = perfil.usuario;
            if (!idUsuario) {
                const { username, password, email, rol } = usuario;
                const data = await apiQuery.post('/auth/registro', { username, password, email, rol }, { mensajeError: 'No se pudo crear el usuario.' });
                idUsuario = data.usuario.id;
                setPerfil((anterior) => ({ ...anterior, usuario: idUsuario }));
            }

            const { usuario: _idUsuario, ...datosPerfil } = perfil;
            await apiQuery.post(
                esColectivo ? '/colectivos' : '/colaboradores',
                sinVacios(datosPerfil),
                { mensajeError: esColectivo ? 'No se pudo registrar la organización.' : 'No se pudo registrar el colaborador.' }
            );

            // Con LinkedIn la sesión ya está iniciada: directo al inicio
            if (esLinkedin) {
                alertas.exito(`¡Bienvenido, ${colaborador.nombreFantasia || colaborador.nombre}!`);
                router.push('/colaboradoras/inicio');
                return true;
            }

            setRegistrado(true);
            return true;
        } catch {
            // apiQuery ya mostró la alerta con el error
            return false;
        }
    };


    const [enviando, setEnviando] = useState(false);

    useLayoutEffect(() => () => {
        setUsuario(modelo_usuario);
        setColaborador(modelo_colaborador);
        setColectivo(modelo_colectivo);
        setPaso(1);
        setRegistrado(false);
        setEnviando(false);
    }, []);

    // Con ?origen=linkedin: se trae el usuario de la sesión (/auth/me) y se precarga el paso 3.
    // Si no hay sesión de colaborador (venció, o se entró a la URL a mano) se manda a ingresar.
    useEffect(() => {
        if (!esLinkedin) return;
        let cancelado = false;

        (async () => {
            const usuarioSesion = await sesion.obtenerUsuario();
            if (cancelado) return;

            if (!usuarioSesion || usuarioSesion.rol !== roles.COLABORADOR) {
                alertas.aviso('Ingresá con LinkedIn para completar tu perfil.');
                router.replace('/ingresar');
                return;
            }

            const { id, username, email, linkedin } = usuarioSesion;
            setUsuario((anterior) => ({ ...anterior, rol: roles.COLABORADOR, username, email }));
            // usuario = id: registrar() no vuelve a llamar a /auth/registro, solo crea el perfil
            setColaborador((anterior) => ({
                ...anterior,
                usuario: id,
                nombre: linkedin?.nombre ?? anterior.nombre,
                apellido: linkedin?.apellido ?? anterior.apellido,
            }));
            setPaso(3);
            setCargandoLinkedin(false);
        })();

        return () => { cancelado = true; };
    }, [esLinkedin, router]);

    // GET /auth/validar: 200 si están libres, 409 con el campo en uso (apiQuery muestra la alerta)
    const usuarioYEmailDisponibles = async () => {
        setEnviando(true);
        try {
            await apiQuery.get('/auth/validar', {
                params: { username: usuario.username.trim(), email: usuario.email.trim() },
                mensajeError: 'No se pudo validar el usuario y el email.',
            });
            return true;
        } catch {
            return false;
        } finally {
            setEnviando(false);
        }
    };

    const handlerSiguiente = async (e) => {
        e.preventDefault();
        if (!pasoCompleto() || enviando) return;

        // Antes de seguir, se chequea que el usuario y el email no estén en uso,
        // así el error aparece acá y no recién al crear la cuenta en el último paso
        if (paso === 1 && !(await usuarioYEmailDisponibles())) return;

        if (paso < CANT_PASOS) {
            setPaso((anterior) => anterior + 1);
            return;
        }

        setEnviando(true);
        await registrar();
        setEnviando(false);
    };

    const formularioDelPaso = () => {
        if (paso === 1) return <PasoTipoCuenta usuario={usuario} onChange={actualizarUsuario} />;
        if (paso === 2) return <PasoContrasena usuario={usuario} onChange={actualizarUsuario} />;
        if (esColectivo) return <PasoDatosColectivo colectivo={colectivo} onChange={actualizarColectivo} />;
        if (esLinkedin) {
            return (
                <div className="flex flex-col gap-[18px]">
                    <PasoDatosColaborador colaborador={colaborador} onChange={actualizarColaborador} />
                    <CheckboxTerminos acepta={usuario.aceptaTerminos} onChange={(valor) => actualizarUsuario('aceptaTerminos', valor)} />
                </div>
            );
        }
        return <PasoDatosColaborador colaborador={colaborador} onChange={actualizarColaborador} />;
    };

    const esUltimoPaso = paso === CANT_PASOS;

    if (cargandoLinkedin) {
        return (
            <div className="mx-auto w-full max-w-[680px] py-4">
                <Card role="status" className="items-center px-6 py-10 text-center text-muted">
                    Cargando tus datos de LinkedIn…
                </Card>
            </div>
        );
    }

    if (registrado) {
        return (
            <div className="mx-auto w-full max-w-[680px] py-4">
                <RegistroExitoso
                    nombre={esColectivo ? colectivo.nombre : (colaborador.nombreFantasia || colaborador.nombre)}
                    rol={esColectivo ? 'colectivo' : 'colaborador'}
                />
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-[680px] flex-col gap-[18px] py-4">
            <div className="flex flex-col gap-1">
                <h1 className="m-0">{esLinkedin ? 'Completá tu perfil' : 'Creá tu cuenta'}</h1>
                {esLinkedin ? (
                    <p className="m-0 text-[14px] text-muted">
                        Ya creamos tu cuenta con LinkedIn ({usuario.email}). Te falta contarnos tus datos de colaborador.
                    </p>
                ) : (
                    <p className="m-0 text-[14px] text-muted">
                        ¿Ya tenés una cuenta? <Link href="/ingresar" className="font-semibold text-accent underline">Ingresá</Link>
                    </p>
                )}
            </div>

            <Card className="gap-[22px] p-6">
                <LineaDePasos pasos={nombresPasos} pasoActual={paso} />
                <div className="h-px bg-sf" />

                <form onSubmit={handlerSiguiente} className="flex flex-col gap-[22px]" noValidate>
                    <div>
                        <p className="eyebrow m-0 mb-1 font-bold">Paso {paso} de {CANT_PASOS}</p>
                        {formularioDelPaso()}
                    </div>

                    <div className="flex flex-wrap-reverse items-center justify-between gap-2.5">
                        <div>
                            {puedoVolverAtras() && (
                                <Button onClick={handlerAtras} disabled={enviando} className="min-h-11">
                                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Atrás
                                </Button>
                            )}
                        </div>
                        <Button type="submit" variant="primary" disabled={!pasoCompleto()} cargando={enviando} className="min-h-11 px-[22px]">
                            {esUltimoPaso ? (enviando ? 'Creando cuenta…' : 'Crear cuenta') : (enviando ? 'Validando…' : 'Siguiente')}
                            {!enviando && (
                                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </Button>
                    </div>
                </form>

                {/* Alternativa al usuario y contraseña: siempre visible, habilitada solo para colaboradores que aceptaron los términos */}
                {paso === 1 && (
                    <div className="flex flex-col gap-2.5">
                        <SeparadorO />
                        <BotonLinkedin
                            deshabilitado={usuario.rol !== roles.COLABORADOR || !usuario.aceptaTerminos}
                            motivoDeshabilitado="Para registrarte con LinkedIn tenés que elegir Colaborador y aceptar los términos y condiciones"
                        >
                            Registrate con LinkedIn
                        </BotonLinkedin>
                    </div>
                )}
            </Card>
        </div>
    )
}