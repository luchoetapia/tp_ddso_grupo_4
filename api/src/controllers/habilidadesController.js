const Habilidad = require('../models/dominio').Habilidad;
const habilidades = []

const obtenerHabilidades = (req, res) => {
    res.status(200).json(habilidades)
}

const crearHabilidad = (req, res) => {
    const { titulo, descripcion } = req.body
    const id = habilidades.length + 1

    const habilidad = new Habilidad(id, titulo, tipoHabilidad, descripcion)
    habilidades.push(habilidad)

    res.status(200).json({ message: 'Habilidad creada exitosamente' })
}

const obtenerHabilidadPorId = (req, res) => {
    const { id } = req.params
    const habilidad = habilidades.find(c => c.id === parseInt(id))

    if (!habilidad) {
        return res.status(404).json({ message: 'Habilidad no encontrada' })
    }
    res.status(200).json(habilidad)
}

module.exports = { obtenerHabilidades, crearHabilidad, obtenerHabilidadPorId };