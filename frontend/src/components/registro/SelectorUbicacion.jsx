'use client'

import { useState } from 'react'
import { Input, Select } from '@/components/common'
import { PROVINCIAS, esUbicacionPredefinida } from '@/helpers/ubicaciones'

const OTRA = 'otra';

const SelectorUbicacion = ({ valor = '', onChange }) => {
    const [eligioOtra, setEligioOtra] = useState(false);
    const esOtra = eligioOtra || (valor !== '' && !esUbicacionPredefinida(valor));
    const opcion = esOtra ? OTRA : valor;

    const elegirOpcion = (e) => {
        const elegida = e.target.value;
        setEligioOtra(elegida === OTRA);
        onChange(elegida === OTRA ? '' : elegida);
    };

    return (
        <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
            <Select label="Ubicación (opcional)" name="ubicacion" value={opcion} onChange={elegirOpcion}>
                <option value="">Sin especificar</option>
                <option value="Argentina">Todo el país (Argentina)</option>
                <option value="CABA">CABA</option>
                <optgroup label="Provincias">
                    {PROVINCIAS.map((provincia) => (
                        <option key={provincia} value={provincia}>{provincia}</option>
                    ))}
                </optgroup>
                <option value={OTRA}>Otra ciudad o barrio…</option>
            </Select>

            {esOtra && (
                <Input
                    label="Ciudad o barrio"
                    name="ubicacionLibre"
                    value={valor}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Ej.: Rosario, Villa Crespo"
                    maxLength={100}
                    autoComplete="address-level2"
                    required
                />
            )}
        </div>
    );
};

export default SelectorUbicacion;
