const EstrategiaAceptacion = require('./EstrategiaAceptacion.js');
const RevisionManual = require('./EstrategiasAceptacionImpl/RevisionManual.js');
const TodoSuma = require('./EstrategiasAceptacionImpl/TodoSuma.js');
const HastaLlenarVacantes = require('./EstrategiasAceptacionImpl/HastaLlenarVacantes.js');
const { BadRequestError } = require('../../../errors/AppError.js');

const estrategiasRegistradas = new Map();

function registrarEstrategia(nombre, claseEstrategia) {
    estrategiasRegistradas.set(nombre.toLowerCase(), claseEstrategia);
}

// Registro por defecto
registrarEstrategia("RevisionManual", RevisionManual);
registrarEstrategia("TodoSuma", TodoSuma);
registrarEstrategia("HastaLlenarVacantes", HastaLlenarVacantes);

function obtenerEstrategia(nombreOInstancia, proyecto = null) {
    if (!nombreOInstancia) {
        return new RevisionManual(proyecto);
    }

    if (nombreOInstancia instanceof EstrategiaAceptacion) {
        if (proyecto) {
            nombreOInstancia.proyecto = proyecto;
        }
        return nombreOInstancia;
    }

    if (typeof nombreOInstancia === 'string') {
        const ClaseEstrategia = estrategiasRegistradas.get(nombreOInstancia.toLowerCase());
        if (!ClaseEstrategia) {
            throw new BadRequestError(`Estrategia desconocida: '${nombreOInstancia}'`);
        }
        return new ClaseEstrategia(proyecto);
    }

    throw new BadRequestError("Estrategia inválida");
}

module.exports = {
    EstrategiaAceptacion,
    RevisionManual,
    TodoSuma,
    HastaLlenarVacantes,
    registrarEstrategia,
    obtenerEstrategia
};
