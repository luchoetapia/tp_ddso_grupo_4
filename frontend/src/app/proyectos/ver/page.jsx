import { Suspense } from "react";
import VerProyectoContenido from "@/views/proyectos/VerProyecto";

export default function VerProyectoPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <VerProyectoContenido />
    </Suspense>
  );
}