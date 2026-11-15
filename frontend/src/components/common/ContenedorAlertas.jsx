"use client";

import { useEffect, useSyncExternalStore } from "react";
import alertas from "@/services/alertas";
import Toast from "./Toast";

// Snapshot del server: siempre la misma referencia vacía (evita errores de hidratación)
const VACIO = [];

// Mobile: Alertas en la parte superior de la pantall
// Desktop: Alertas en la esquina inferior derecha
export default function ContenedorAlertas() {
    const lista = useSyncExternalStore(alertas.suscribir, alertas.obtener, () => VACIO);

    useEffect(() => {
        alertas.recuperarDiferidas();
    }, []);

    return (
        <div
            className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col-reverse gap-2 p-3 pt-[max(12px,env(safe-area-inset-top))] md:inset-x-auto md:top-auto md:right-4 md:bottom-4 md:w-[350px] md:flex-col md:p-0"
        >
            {lista.map((alerta) => (
                <div key={alerta.id} className="pointer-events-auto">
                    <Toast type={alerta.tipo} onClose={() => alertas.cerrar(alerta.id)}>
                        {alerta.mensaje}
                    </Toast>
                </div>
            ))}
        </div>
    );
}
