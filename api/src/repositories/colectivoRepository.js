const ColectivoModel = require('../database/schemas/colectivoSchema.js');

const DATOS_ADMINISTRADOR = 'username email activo';

const filtroAdministradoPor = (usuario) => ({ $or: [{ usuario }, { administradores: usuario }] });

class ColectivoRepository {
    async buscarConPaginacion(pagina = 1, limite = 10, filtros = {}, orden = {}, datosNecesarios = null) {
        limite = Math.min(limite, 100); // Tope de documentos por página

        const [colectivos, total] = await Promise.all([
            ColectivoModel.find(filtros, datosNecesarios)
                .paginar({ pagina, limite, orden })
                .populate('proyectos'),
            ColectivoModel.countDocuments(filtros)
        ]);

        return { colectivos, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
    }

    async findAll() {
        return await ColectivoModel.find().populate('proyectos');
    }

    async findByNombre(nombre) {
        return await ColectivoModel.findOne({ nombre });
    }

    async findByUsuario(usuario) {
        return await ColectivoModel.findOne(filtroAdministradoPor(usuario));
    }

    async findByUsuarioConProyectos(usuario) {
        return await ColectivoModel.findOne(filtroAdministradoPor(usuario)).populate('proyectos');
    }

    async obtenerAdministradores(id) {
        return await ColectivoModel.findById(id, { usuario: 1, administradores: 1 })
            .populate('usuario', DATOS_ADMINISTRADOR)
            .populate('administradores', DATOS_ADMINISTRADOR);
    }

    async agregarAdministrador(id, idUsuario) {
        return await ColectivoModel.findByIdAndUpdate(id, { $addToSet: { administradores: idUsuario } }, { new: true });
    }

    async quitarAdministrador(id, idUsuario) {
        return await ColectivoModel.findByIdAndUpdate(id, { $pull: { administradores: idUsuario } }, { new: true });
    }

    async findById(id) {
        return await ColectivoModel.findById(id).populate('proyectos');
    }

    async findBy(query) {
        return await ColectivoModel.find(query).populate('proyectos');
    }

    async save(datos) {
        const colectivo = new ColectivoModel(datos);
        await colectivo.save();
        return await colectivo.populate('proyectos');
    }

    async update(id, cambios) {
        return await ColectivoModel.findByIdAndUpdate(id, cambios, { new: true }).populate('proyectos');
    }

    async totalActivos() {
        const estadisticas = await this.estadisticasGlobales();
        return estadisticas.activos;
    }

    async estadisticasGlobales() {
        const [resultado] = await ColectivoModel.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    activos: {
                        $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] }
                    },
                    desactivados: {
                        $sum: { $cond: [{ $eq: ['$active', false] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    activos: 1,
                    desactivados: 1
                }
            }
        ]);

        return resultado ?? { total: 0, activos: 0, desactivados: 0 };
    }

    async obtenerProyectos(id) {
        const colectivo = await ColectivoModel.findById(id, { _id: 0, proyectos: 1 })
            .populate('proyectos', 'finalizado');
        return colectivo ? colectivo.proyectos : null;
    }

    async obtenerProyectosConPerfiles(id) {
        const colectivo = await ColectivoModel.findById(id, { _id: 0, proyectos: 1 })
            .populate('proyectos', 'titulo finalizado perfiles');
        return colectivo ? colectivo.proyectos : null;
    }
}

module.exports = new ColectivoRepository();
