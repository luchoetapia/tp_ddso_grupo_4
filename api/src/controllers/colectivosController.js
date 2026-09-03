const Colectivo = require('../models/dominio').Colectivo;
const colectivos = []

const obtenerColectivos = (req, res) => {
    res.status(200).json(colectivos)
}

const crearColectivo = (req, res) => {
    const { nombre, descripcion, ubicacion, tipo, proyectos } = req.body
    const id = colectivos.length + 1

    const colectivo = new Colectivo(id, nombre, descripcion, ubicacion, tipo, proyectos)
    colectivos.push(colectivo)

    res.status(200).json({ message: 'Colectivo creado exitosamente' })
}

const obtenerColectivoPorId = (req, res) => {
    const { id } = req.params
    const colectivo = colectivos.find(c => c.id === parseInt(id))
    
    if (!colectivo) {
        return res.status(404).json({ message: 'Colectivo no encontrado' })
    }
    res.status(200).json(colectivo)
}

module.exports = { obtenerColectivos, crearColectivo, obtenerColectivoPorId };