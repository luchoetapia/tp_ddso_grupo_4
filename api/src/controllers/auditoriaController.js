const auditoriaService = require('../services/auditoriaService.js');
const { AuditoriaPublic } = require('../dtos/auditoriaPublic.js');
const { Paginado } = require('../dtos/paginado.js');

class AuditoriaController {
    constructor() {
        this.auditoriaService = auditoriaService;
    }

    // Historial completo de la plataforma (admin)
    obtenerAuditoria = async (req, res) => {
        const resultado = await this.auditoriaService.listar(req.query);
        res.status(200).json(Paginado.desde(resultado.registros, resultado, AuditoriaPublic));
    }

    // Historial del colectivo de la sesión
    obtenerAuditoriaDeMiColectivo = async (req, res) => {
        const resultado = await this.auditoriaService.listarDelColectivo(req.usuario.id, req.query);
        res.status(200).json(Paginado.desde(resultado.registros, resultado, AuditoriaPublic));
    }
}

module.exports = { AuditoriaController };
