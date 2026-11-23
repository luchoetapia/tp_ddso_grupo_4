import HistorialAuditoria from "@/components/auditoria/HistorialAuditoria";

export default function AuditoriaGlobal() {
    return (
        <section className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1>Auditoría de la plataforma</h1>
                <p className="text-muted">
                    Todo lo que se hizo sobre organizaciones, proyectos, postulaciones y colaboraciones, incluida la
                    revisión de denuncias: qué se hizo, quién lo hizo y cuándo.
                </p>
            </header>
            <HistorialAuditoria url="/auditoria" global />
        </section>
    );
}
