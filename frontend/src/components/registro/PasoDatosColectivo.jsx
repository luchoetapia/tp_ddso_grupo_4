import { Input, Select, Textarea } from '@/components/common'
import SelectorUbicacion from './SelectorUbicacion'

// Mismos valores que TipoColectivo en la API
const tiposDeOrganizacion = [
    { valor: 'fundacion', texto: 'Fundación' },
    { valor: 'asociacion_barrial', texto: 'Asociación barrial' },
    { valor: 'ong', texto: 'ONG' },
    { valor: 'asamblea', texto: 'Asamblea' },
];

const PasoDatosColectivo = ({ colectivo, onChange, titulo = 'Contanos sobre tu organización' }) => {
    const campo = (nombre) => ({
        name: nombre,
        value: colectivo[nombre] ?? '',
        onChange: (e) => onChange(nombre, e.target.value),
    });

    return (
        <div className="flex flex-col gap-[18px]">
            {titulo && <h2 className="m-0 text-[24px]">{titulo}</h2>}

            <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                <Input label="Nombre de la organización" {...campo('nombre')} autoComplete="organization" required />
                <Select label="Tipo de organización" {...campo('tipo')} required>
                    <option value="">Elegí un tipo</option>
                    {tiposDeOrganizacion.map(({ valor, texto }) => (
                        <option key={valor} value={valor}>{texto}</option>
                    ))}
                </Select>
            </div>

            <SelectorUbicacion valor={colectivo.ubicacion ?? ''} onChange={(valor) => onChange('ubicacion', valor)} />
            <Textarea
                label="Descripción"
                {...campo('descripcion')}
                rows={4}
                placeholder="Contá qué causa llevan adelante y a quiénes acompañan"
                required
            />
        </div>
    );
};

export default PasoDatosColectivo;
