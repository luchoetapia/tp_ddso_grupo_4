import { Tag } from '@/components/common'

// El cron diario del back marca los proyectos en curso que no cargaron logros en los últimos días
// (requiereRevisionManual). Si el proyecto ya terminó, la marca no aplica.
const PildoraSinActualizaciones = ({ proyecto }) => {
    if (!proyecto?.requiereRevisionManual || proyecto.finalizado) return null;

    return (
        <Tag variant="error" title="No tuvo actualizaciones recientes y quedó marcado para revisión">
            Sin actualizaciones
        </Tag>
    );
};

export default PildoraSinActualizaciones
