const auditoriaService = require('../services/auditoriaService.js');
const { AuditoriaPublic } = require('../dtos/auditoriaPublic.js');
const { Paginado } = require('../dtos/paginado.js');

class AuditoriaController {
    constructor() {
        this.auditoriaService = auditoriaService;
    }

    obtenerAuditoria = async (req, res) => {
        const resultado = await this.auditoriaService.listar(req.query);
        res.status(200).json(Paginado.desde(resultado.registros, resultado, AuditoriaPublic));
    }

    obtenerAuditoriaDeMiColectivo = async (req, res) => {
        const resultado = await this.auditoriaService.listarDelColectivo(req.usuario.id, req.query);
        res.status(200).json(Paginado.desde(resultado.registros, resultado, AuditoriaPublic));
    }
}

module.exports = { AuditoriaController };
