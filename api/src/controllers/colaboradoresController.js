import { Colaborador } from "../models/dominio";

const colaboradores = []

export const obtenerColaboradoras = (req, res) => {
    res.status(200).json(colaboradores)
}

export const crearColaboradora = (req, res) => {
    const { nombre, apellido, nombreFantasia, cuentaGit, habilidades, pronombres, presentacion } = req.body

    const colaboradora = new Colaborador(nombre, apellido, nombreFantasia, cuentaGit, habilidades, pronombres, presentacion)
    colaboradores.push(colaboradora)

    res.status(200).json({ message: 'Colaboradora creada exitosamente' })
}

export const obtenerColaboradoraPorCuentaGit = (req, res) => {
    const { cuentaGit } = req.params
    const colaboradora = colaboradores.find(c => c.cuentaGit === cuentaGit)

    if (!colaboradora) {
        return res.status(404).json({ message: 'Colaborador no encontrada' })
    }
    res.status(200).json(colaboradora)
}