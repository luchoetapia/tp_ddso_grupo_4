const palabraBaneadaService = require('../services/palabraBaneadaSevice.js');
const { PalabraBaneadaPublic } = require('../dtos/palabraBaneadaPublic.js');
const { Paginado } = require('../dtos/paginado.js');

class PalabraBaneadaController {
    constructor() {
        this.palabraBaneadaService = palabraBaneadaService;
    }

    obtenerPalabras = async (req, res) => {
        const { pagina, limite, activa } = req.query;

        const resultado = await this.palabraBaneadaService.listar({ pagina, limite, activa });
        res.status(200).json(Paginado.desde(resultado.palabras, resultado, PalabraBaneadaPublic))
    }

    agregarPalabra = async (req, res) => {
        const palabra = await this.palabraBaneadaService.agregar(req.body.palabra)
        res.status(201).json({ message: 'Palabra baneada agregada exitosamente', data: PalabraBaneadaPublic.desde(palabra) })
    }

    activarPalabra = async (req, res) => {
        const palabra = await this.palabraBaneadaService.activar(req.params.id)
        res.status(200).json(PalabraBaneadaPublic.desde(palabra))
    }

    desactivarPalabra = async (req, res) => {
        const palabra = await this.palabraBaneadaService.desactivar(req.params.id)
        res.status(200).json(PalabraBaneadaPublic.desde(palabra))
    }
}

module.exports = { PalabraBaneadaController };
