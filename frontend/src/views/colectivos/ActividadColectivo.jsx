import HistorialAuditoria from "@/components/auditoria/HistorialAuditoria";

export default function ActividadColectivo() {
    return (
        <section className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1>Actividad de la organización</h1>
                <p className="text-muted">
                    Historial de lo que se hizo sobre tu organización, sus proyectos, postulaciones y colaboraciones:
                    quién lo hizo y cuándo.
                </p>
            </header>
            <HistorialAuditoria url="/colectivos/me/auditoria" />
        </section>
    );
}
