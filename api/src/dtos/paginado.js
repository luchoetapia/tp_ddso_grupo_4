// Respuesta estándar de los listados paginados: los elementos de la página (ya como DTO) + datos de la paginación
class Paginado {
    static desde(elementos, { pagina, limite, total, totalPaginas }, Dto) {
        return {
            data: elementos.map(Dto.desde),
            paginacion: { pagina, limite, total, totalPaginas }
        };
    }
}

module.exports = { Paginado };
