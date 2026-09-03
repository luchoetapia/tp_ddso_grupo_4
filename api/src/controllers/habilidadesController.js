import { Habilidad } from "../models/dominio";

const habilidades = []

export const obtenerHabilidades = (req, res) => {
    res.status(200).json(habilidades)
}

export const crearHabilidad = (req, res) => {
    const { titulo, descripcion } = req.body
    const id = habilidades.length + 1

    const habilidad = new Habilidad(id, titulo, descripcion)
    habilidades.push(habilidad)

    res.status(200).json({ message: 'Habilidad creada exitosamente' })
}

export const obtenerHabilidadPorId = (req, res) => {
    const { id } = req.params
    const habilidad = habilidades.find(c => c.id === parseInt(id))

    if (!habilidad) {
        return res.status(404).json({ message: 'Habilidad no encontrada' })
    }
    res.status(200).json(habilidad)
}