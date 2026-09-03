import { Proyecto } from "../models/dominio";

const proyectos = []

export const obtenerProyectos = (req, res) => {
    res.status(200).json(proyectos)
}

export const crearProyecto = (req, res) => {
    const { titulo, descripcion, habilidades, tipoCompromiso, modalidadColaboracion } = req.body
    const id = proyectos.length + 1

    const proyecto = new Proyecto(id, titulo, descripcion, habilidades, tipoCompromiso, modalidadColaboracion)
    proyectos.push(proyecto)

    res.status(200).json({ message: 'Proyecto creado exitosamente' })
}

export const obtenerProyectoPorId = (req, res) => {
    const { id } = req.params
    const proyecto = proyectos.find(p => p.id === parseInt(id))

    if (!proyecto) {
        return res.status(404).json({ message: 'Proyecto no encontrado' })
    }
    res.status(200).json(proyecto)
}