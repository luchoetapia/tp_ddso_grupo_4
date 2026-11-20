const palabraBaneadaRepository = require('../repositories/palabraBaneadaRepository');

const LEET = { '4': 'a', '@': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '$': 's', '7': 't' };

class PalabraBaneadaService {
    _normalizar = (texto) => {
        return texto
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // saca tildes
            .replace(/[4@3105$7]/g, c => LEET[c])
            .replace(/(.)\1{2,}/g, '$1$1');                     // Saca letras repetidas
    }

    detectar = async (texto) => {
        baneadas = await palabraBaneadaRepository.listadoPalabrasBaneadas();
        const normalizado = this._normalizar(texto);

        // Evita detectar palabras baneadas dentro de una palabra | Ej: computadora
        return terminos.filter(t =>
            new RegExp(`\\b${this._normalizar(texto)}\\b`).test(normalizado)
        );
    }
}

module.exports = new PalabraBaneadaService();