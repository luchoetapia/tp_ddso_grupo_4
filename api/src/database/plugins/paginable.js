// Plugin de Mongoose: agrega el query helper `paginar` a las consultas del schema.
// Uso: Model.find(filtros).paginar({ pagina, limite, orden })
function paginable(schema) {
    schema.query.paginar = function ({ pagina = 1, limite = 10, orden = {} } = {}) {
        const salto = (pagina - 1) * limite; // Cuántos documentos ignorar desde el inicio
        return this.sort(orden).skip(salto).limit(limite);
    };
}

module.exports = paginable;
