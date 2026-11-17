'use client'

import { useState } from "react";
import { Button, Modal, Textarea } from "@/components/common";
import apiQuery from "@/services/api/apiQuery";

const mensajeSugerido = (colaboradora, proyecto, perfil) =>
    `Hola ${colaboradora.nombreFantasia || colaboradora.cuentaGit}, vimos tu perfil y nos encantaría que te sumes como "${perfil.titulo}" en el proyecto "${proyecto.titulo}". ¿Te interesa?`;

const ContactarColaboradora = ({ colaboradora, proyecto, perfil, onCerrar, onEnviado }) => {
    const [mensaje, setMensaje] = useState(() => mensajeSugerido(colaboradora, proyecto, perfil));
    const [error, setError] = useState(null);
    const [enviando, setEnviando] = useState(false);

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
                `/proyectos/${proyecto.id}/perfiles/${perfil.id}/contactarColaborador`,
                { cuentaGit: colaboradora.cuentaGit, mensaje: texto },
                { mensajeError: "No se pudo enviar el mensaje." }
            );
            onEnviado(`Le enviaste el mensaje a ${colaboradora.nombreFantasia || colaboradora.cuentaGit}.`);
        } catch {
            // apiQuery ya mostró la alerta de error
        } finally {
            setEnviando(false);
        }
    };

    return (
        <Modal
            open
            onClose={onCerrar}
            title={`Contactar a ${colaboradora.nombreFantasia || colaboradora.cuentaGit}`}
        >
            <form onSubmit={enviarMensaje} className="flex flex-col gap-3">
                <p className="text-[13px] text-muted">
                    Le llega como mensaje interno por el perfil <b>{perfil.titulo}</b> de <b>{proyecto.titulo}</b>.
                </p>
                <Textarea
                    label="Mensaje"
                    rows={5}
                    value={mensaje}
                    onChange={(e) => {
                        setMensaje(e.target.value);
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
