const homeService = require('../services/homeService.js');

class HomeController {
    constructor() {
        this.homeService = homeService;
    }

    obtenerContadores = async (req, res) => {
        const contadores = await this.homeService.contadores();
        res.status(200).json(contadores);
    }
}

module.exports = { HomeController };
