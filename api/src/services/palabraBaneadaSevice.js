const palabraBaneadaRepository = require('../repositories/palabraBaneadaRepository');
const mongoose = require('mongoose');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError.js');

const LEET = { '4': 'a', '@': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '$': 's', '7': 't' };

class PalabraBaneadaService {
    _normalizar = (texto) => {
        return texto
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // saca tildes
            .replace(/[4@3105$7]/g, c => LEET[c])
            .replace(/(.)\1+/g, '$1');                          // Saca letras repetidas
    }

    listar = async ({ pagina = 1, limite = 10, activa } = {}) => {
        const filtros = activa === undefined ? {} : { activa };
        return await palabraBaneadaRepository.listadoPalabrasBaneadasPaginadas(pagina, limite, filtros);
    }

    // Se guarda en minúscula: la detección normaliza igual y evita duplicados como "Tonto" / "tonto"
    agregar = async (palabra) => {
        const normalizada = palabra.trim().toLowerCase();

        const existente = await palabraBaneadaRepository.obtenerPalabra(normalizada);
        if (existente) {
            const sugerencia = existente.activa ? '' : ' (está desactivada, se puede activar)';
            throw new ConflictError(`La palabra '${normalizada}' ya existe${sugerencia}`);
        }

        try {
            return await palabraBaneadaRepository.agregarPalabra(normalizada);
        } catch (error) {
            // El índice único cubre dos altas simultáneas de la misma palabra
            if (error.code === 11000) throw new ConflictError(`La palabra '${normalizada}' ya existe`);
            throw error;
        }
    }

    activar = async (id) => {
        return await this._cambiarEstado(id, palabraBaneadaRepository.activarPalabra);
    }

    desactivar = async (id) => {
        return await this._cambiarEstado(id, palabraBaneadaRepository.desactivarPalabra);
    }

    _cambiarEstado = async (id, accion) => {
        if (!mongoose.isValidObjectId(id)) {
            throw new BadRequestError("Id de palabra baneada inválido");
        }

        const palabra = await accion(id);
        if (!palabra) {
            throw new NotFoundError("Palabra baneada no encontrada");
        }

        return palabra;
    }

    _escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Devuelve las palabras baneadas que aparecen en el texto (lista vacía si no hay ninguna)
    detectar = async (texto) => {
        if (!texto) return [];

        const baneadas = await palabraBaneadaRepository.listadoPalabrasBaneadas();
        return this._buscar(texto, baneadas);
    }

    // Revisa varios textos con una sola consulta; devuelve solo los campos que tienen palabras baneadas
    detectarEnCampos = async (campos) => {
        const textos = Object.entries(campos).filter(([, texto]) => typeof texto === 'string' && texto);
        if (textos.length === 0) return {};

        const baneadas = await palabraBaneadaRepository.listadoPalabrasBaneadas();
        const resultado = {};
        for (const [campo, texto] of textos) {
            const encontradas = this._buscar(texto, baneadas);
            if (encontradas.length > 0) resultado[campo] = encontradas;
        }

        return resultado;
    }

    // Busca la palabra completa, no dentro de otra | Ej: no detecta una baneada dentro de "computadora"
    // Se usa \p{L} en lugar de \b para que las letras como la ñ cuenten como parte de la palabra
    _buscar = (texto, baneadas) => {
        const normalizado = this._normalizar(texto);

        return baneadas.filter(palabra => {
            const termino = this._escaparRegex(this._normalizar(palabra));
            return new RegExp(`(?<![\\p{L}\\p{N}])${termino}(?![\\p{L}\\p{N}])`, 'u').test(normalizado);
        });
    }
}

module.exports = new PalabraBaneadaService();