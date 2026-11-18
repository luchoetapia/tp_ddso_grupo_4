const ColectivoModel = require('../database/schemas/colectivoSchema.js');

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
        return await ColectivoModel.findOne({ usuario });
    }

    async findByUsuarioConProyectos(usuario) {
        return await ColectivoModel.findOne({ usuario }).populate('proyectos');
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
        return await ColectivoModel.countDocuments({ active: true })
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
