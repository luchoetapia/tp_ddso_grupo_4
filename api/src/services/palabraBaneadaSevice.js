const palabraBaneadaRepository = require('../repositories/palabraBaneadaRepository');

const LEET = { '4': 'a', '@': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '$': 's', '7': 't' };

class PalabraBaneadaService {
    _normalizar = (texto) => {
        return texto
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // saca tildes
            .replace(/[4@3105$7]/g, c => LEET[c])
            .replace(/(.)\1+/g, '$1');                          // Saca letras repetidas
    }

    _escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Devuelve las palabras baneadas que aparecen en el texto (lista vacía si no hay ninguna)
    detectar = async (texto) => {
        if (!texto) return [];

        const baneadas = await palabraBaneadaRepository.listadoPalabrasBaneadas();
        const normalizado = this._normalizar(texto);

        // Busca la palabra completa, no dentro de otra | Ej: no detecta una baneada dentro de "computadora"
        return baneadas.filter(palabra => {
            const termino = this._escaparRegex(this._normalizar(palabra));
            return new RegExp(`(?<![\\p{L}\\p{N}])${termino}(?![\\p{L}\\p{N}])`, 'u').test(normalizado);
        });
    }
}

module.exports = new PalabraBaneadaService();