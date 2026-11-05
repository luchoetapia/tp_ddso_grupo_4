import { useState } from 'react'
import './registroOrg.css'

const RegistroOrg = () => {
  const [value, setValue] = useState('')

  const handleChange = (e) => {
    setValue(e.target.value)
  }

  return (
    <form>
        <label>Nombre de la organización: 
            <input type="text" name="nombreOrg" />
        </label>
        <label> Tipo de organización:
            <select onChange={handleChange}>
                <option value="fundacion">Fundación</option>
                <option value="asociacion_barrial">Asociación Barrial</option>
                <option value="ong">ONG</option>
                <option value="cooperativa">Cooperativa</option>
                <option value="empresa_social">Empresa Social</option>
            </select>
        </label>
        <label>Descripción de la organización: 
            <input type="text" name="descripcionOrg" />
        </label>
        <label>Ubicación de la organización:
            <input type="text" name="ubicacionOrg" />
        </label>
        <button type="submit">Registrar Organización</button>
    </form>
  );
};

export default RegistroOrg;