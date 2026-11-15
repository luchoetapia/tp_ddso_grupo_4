'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import apiQuery from "@/services/api/apiQuery"
import alertas from "@/services/alertas"

const modelo_usuario = {
    username: null,
    password: null,
    repeat_password: null,
    email: null,
    rol: null
}

const modelo_colaborador = {
    usuario: null,
    nombre: null,
    apellido: null,
    nombreFantasia: null,
    pronombres: null,
    cuentaGit: null,
    presentacion: null
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
    const router = useRouter();

    const sinVacios = (datos) =>
        Object.fromEntries(Object.entries(datos).filter(([, valor]) => valor !== null && valor !== ''));

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

            alertas.exito(esColectivo ? 'Organización registrada exitosamente' : 'Colaborador registrado exitosamente');
            router.push('/');
            return true;
        } catch {
            // apiQuery ya mostró la alerta con el error
            return false;
        }
    };


    return (
        <div></div>       
    )
}