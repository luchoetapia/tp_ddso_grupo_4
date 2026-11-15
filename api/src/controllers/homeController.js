const homeService = require('../services/homeService.js');
const proyectoService = require('../services/proyectoService.js');
const { ProyectoPublic } = require('../dtos/proyectoPublic.js');

class HomeController {
    constructor() {
        this.homeService = homeService;
        this.proyectoService = proyectoService;
    }

    obtenerContadores = async (req, res) => {
        const contadores = await this.homeService.contadores();
        res.status(200).json(contadores);
    }

    obtenerRankingHabilidades = async (req, res) => {
        const ranking = await this.homeService.rankingHabilidades();
        res.status(200).json(ranking);
    }

    obtenerDestacados = async (req, res) => {
        const destacados = await this.proyectoService.proyectosDestacados();
        res.status(200).json(destacados.map(ProyectoPublic.desde));
    }
}

module.exports = { HomeController };
