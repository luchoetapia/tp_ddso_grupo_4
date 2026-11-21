const reporteService = require('../services/reporteService.js');
const { ReportePublic } = require('../dtos/reportePublic.js');
const { Paginado } = require('../dtos/paginado.js');

class ReporteController {
    constructor() {
        this.reporteService = reporteService;
    }

    obtenerReportes = async (req, res) => {
        const { pagina, limite, estado, tipoEntidad } = req.query;

        const resultado = await this.reporteService.listar({ pagina, limite, estado, tipoEntidad });
        res.status(200).json(Paginado.desde(resultado.reportes, resultado, ReportePublic))
    }

    obtenerReportePorId = async (req, res) => {
        const detalle = await this.reporteService.obtenerDetalle(req.params.id)
        res.status(200).json(ReportePublic.detalle(detalle))
    }

    notificarReporte = async (req, res) => {
        const reporte = await this.reporteService.notificar(req.params.id)
        res.status(200).json(ReportePublic.desde(reporte))
    }

    validarReporte = async (req, res) => {
        const reporte = await this.reporteService.validar(req.params.id, req.usuario.id, req.body.comentario)
        res.status(200).json(ReportePublic.desde(reporte))
    }

    rechazarReporte = async (req, res) => {
        const reporte = await this.reporteService.rechazar(req.params.id, req.usuario.id, req.body.comentario)
        res.status(200).json(ReportePublic.desde(reporte))
    }
}

module.exports = { ReporteController };
