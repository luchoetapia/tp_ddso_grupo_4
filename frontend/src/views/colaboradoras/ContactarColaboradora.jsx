'use client'

import { useState } from "react";
import { Button, Modal, Select, Textarea } from "@/components/common";
import { nombreVisible } from "@/components/colaboradores/TarjetaColaborador";
import apiQuery from "@/services/api/apiQuery";

const claveDe = ({ proyecto, perfil }) => `${proyecto.id}:${perfil.id}`;

const mensajeSugerido = (nombre, { proyecto, perfil }) =>
    `Hola ${nombre}, vimos tu perfil y nos encantaría que te sumes como "${perfil.titulo}" en el proyecto "${proyecto.titulo}". ¿Te interesa?`;

// Agrupa los perfiles compatibles por proyecto para el <select> (un <optgroup> por proyecto)
const agruparPorProyecto = (perfilesCompatibles) => {
    const grupos = new Map();
    for (const compatible of perfilesCompatibles) {
        const grupo = grupos.get(compatible.proyecto.id) ?? { proyecto: compatible.proyecto, perfiles: [] };
        grupo.perfiles.push(compatible);
        grupos.set(compatible.proyecto.id, grupo);
    }
    return [...grupos.values()];
};

// colaboradora: un colaborador de /colectivos/me/potencialesColaboradores (trae perfilesCompatibles).
// El mensaje se manda por uno de esos perfiles: solo se ofrecen los que cumple.
const ContactarColaboradora = ({ colaboradora, onCerrar, onEnviado }) => {
    const nombre = nombreVisible(colaboradora);
    const perfiles = colaboradora.perfilesCompatibles;

    const [clave, setClave] = useState(() => claveDe(perfiles[0]));
    const [mensaje, setMensaje] = useState(() => mensajeSugerido(nombre, perfiles[0]));
    const [editado, setEditado] = useState(false);
    const [error, setError] = useState(null);
    const [enviando, setEnviando] = useState(false);

    const elegido = perfiles.find((p) => claveDe(p) === clave) ?? perfiles[0];

    // Si todavía no tocó el texto, el mensaje sugerido sigue al perfil elegido
    const cambiarPerfil = (nuevaClave) => {
        setClave(nuevaClave);
        if (!editado) setMensaje(mensajeSugerido(nombre, perfiles.find((p) => claveDe(p) === nuevaClave)));
    };

    const enviarMensaje = async (e) => {
        e.preventDefault();
        const texto = mensaje.trim();
        if (!texto) {
            setError("Escribí un mensaje.");
            return;
        }

        setEnviando(true);
        try {
            await apiQuery.post(
                `/proyectos/${elegido.proyecto.id}/perfiles/${elegido.perfil.id}/contactarColaborador`,
                { cuentaGit: colaboradora.cuentaGit, mensaje: texto },
                { mensajeError: "No se pudo enviar el mensaje." }
            );
            onEnviado(`Le enviaste el mensaje a ${nombre}.`);
        } catch {
            // apiQuery ya mostró la alerta de error
        } finally {
            setEnviando(false);
        }
    };

    return (
        <Modal open onClose={onCerrar} title={`Enviar mensaje a ${nombre}`} ancho="max-w-[840px]">
            <form onSubmit={enviarMensaje} className="flex flex-col gap-3">
                <Select label="Por el perfil" value={clave} onChange={(e) => cambiarPerfil(e.target.value)}>
                    {agruparPorProyecto(perfiles).map(({ proyecto, perfiles: delProyecto }) => (
                        <optgroup key={proyecto.id} label={proyecto.titulo}>
                            {delProyecto.map((p) => (
                                <option key={claveDe(p)} value={claveDe(p)}>{p.perfil.titulo}</option>
                            ))}
                        </optgroup>
                    ))}
                </Select>
                <p className="m-0 text-[13px] text-muted">
                    Solo aparecen los perfiles para los que cumple las habilidades requeridas. Le llega como mensaje interno.
                </p>
                <Textarea
                    label="Mensaje"
                    rows={8}
                    value={mensaje}
                    onChange={(e) => {
                        setMensaje(e.target.value);
                        setEditado(true);
                        setError(null);
                    }}
                    error={error}
                    autoFocus
                />
                <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="primary" cargando={enviando}>
                        Enviar
                    </Button>
                    <Button onClick={onCerrar} disabled={enviando}>
                        Cancelar
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ContactarColaboradora;
