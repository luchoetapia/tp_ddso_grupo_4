'use client'

import { useState } from 'react'
import './registroOrg.css'
import { Card } from '@/components/common';

const registrar = () => {
  const [nombreOrg, setNombreOrg] = useState('');
  const [tipoOrg, setTipoOrg] = useState('');
  const [descripcionOrg, setDescripcionOrg] = useState('');
  const [ubicacionOrg, setUbicacionOrg] = useState('');

  const registrarColectivo = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/colectivos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nombre: nombreOrg,
            tipo: tipoOrg,
            descripcion: descripcionOrg,
            ubicacion: ubicacionOrg,
        }),
    });
    const data = await res.json();

    if (res.ok)
        alert('Organización registrada exitosamente');

    else
        alert('Error al registrar la organización: ' + data.message);
    };

    const registrarColaborador = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/colaboradores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario: usuario,
                nombre: nombreColaborador,
                apellido: apellidoColaborador,
                nombreFantasia: nombreFantasia, 
                cuentaGit: cuentaGitColaborador,
                habilidades: habilidadesColaborador,
                pronombres: pronombres,
                presentacion: presentacion,
                deseaSerContactado: deseaSerContactado,
                contactos: contactos,
            }),
        });
        const data = await res.json();

        if(res.ok)
            alert('Colaborador registrado exitosamente');
        else
            alert('Error al registrar el colaborador: ' + data.message);
    };

  return (
    <section className =  ></section>
    <div>
        <input type="radio" name="selectorColectivo" value="Colectivo" onChange={(e) => setTipoRegistro(e.target.value)} /> Colectivo
        <input type="radio" name="selectorColaborador" value="Colaborador" onChange={(e) => setTipoRegistro(e.target.value)} /> Colaborador
    </div> 
    
    
    
    <form onSubmit={registrarColectivo}>
        <label>Nombre de la organización:
            <input type="text" name="nombreOrg" value={nombreOrg} onChange={(e) => setNombreOrg(e.target.value)} />
        </label>
        <label> Tipo de organización:
            <select onChange={(e) => setTipoOrg(e.target.value)} value={tipoOrg} name="tipoOrg" required>
                <option value="">Elegí un tipo</option>
                <option value="fundacion">Fundación</option>
                <option value="asociacion_barrial">Asociación Barrial</option>
                <option value="ong">ONG</option>
                <option value="asamblea">Asamblea</option>
            </select>

        </label>
        <label>Descripción de la organización:
            <input type="text" name="descripcionOrg" value={descripcionOrg} onChange={(e) => setDescripcionOrg(e.target.value)} />
        </label>
        <label>Ubicación de la organización:
            <input type="text" name="ubicacionOrg" value={ubicacionOrg} onChange={(e) => setUbicacionOrg(e.target.value)} />
        </label>
        <button type="submit">Registrar Organización</button>
    </form>
  );
};

export default RegistroOrg;