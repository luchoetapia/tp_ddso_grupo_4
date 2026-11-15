"use client";

import { useSyncExternalStore } from "react";
import { aplicarTema, leerTema, suscribirTema } from "@/services/tema";

const temaDelServidor = () => "dispositivo";

export default function useTema() {
    const tema = useSyncExternalStore(suscribirTema, leerTema, temaDelServidor);
    return [tema, aplicarTema];
}
