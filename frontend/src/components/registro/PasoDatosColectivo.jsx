import { Input, Select, Textarea } from '@/components/common'

// Mismos valores que TipoColectivo en la API
const tiposDeOrganizacion = [
    { valor: 'fundacion', texto: 'Fundación' },
    { valor: 'asociacion_barrial', texto: 'Asociación barrial' },
    { valor: 'ong', texto: 'ONG' },
    { valor: 'asamblea', texto: 'Asamblea' },
];

const PasoDatosColectivo = ({ colectivo, onChange }) => {
    const campo = (nombre) => ({
        name: nombre,
        value: colectivo[nombre] ?? '',
        onChange: (e) => onChange(nombre, e.target.value),
    });

    return (
        <div className="flex flex-col gap-[18px]">
            <h2 className="m-0 text-[24px]">Contanos sobre tu organización</h2>

            <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                <Input label="Nombre de la organización" {...campo('nombre')} autoComplete="organization" required />
                <Select label="Tipo de organización" {...campo('tipo')} required>
                    <option value="">Elegí un tipo</option>
                    {tiposDeOrganizacion.map(({ valor, texto }) => (
                        <option key={valor} value={valor}>{texto}</option>
                    ))}
                </Select>
            </div>

            <Input label="Ubicación (opcional)" {...campo('ubicacion')} placeholder="Barrio, ciudad" />
            <Textarea label="Descripción (opcional)" {...campo('descripcion')} rows={4} />
        </div>
    );
};

export default PasoDatosColectivo;
