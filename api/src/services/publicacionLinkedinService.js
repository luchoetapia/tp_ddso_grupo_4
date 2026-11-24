const AuthRepository = require('../auth/authRepository.js');
const colaboradorService = require('./colaboradorService.js');
const colaboracionRepository = require('../repositories/colaboracionRepository.js');
const colectivoRepository = require('../repositories/colectivoRepository.js');
const proyectoRepository = require('../repositories/proyectoRepository.js');
const palabraBaneadaService = require('./palabraBaneadaSevice.js');
const linkedinService = require('../linkedin/linkedinService.js');
const { LinkedinNoVinculadoError } = require('../linkedin/linkedinService.js');
const { descifrar } = require('../linkedin/cifrado.js');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../errors/AppError.js');

const idDe = (ref) => String(ref?._id ?? ref?.id ?? ref);

// Publicaciones en LinkedIn:
//  - colaboradores, sobre los proyectos en los que participan
//  - colectivos (titular o administradores), sobre los logros de sus proyectos
// Siempre se publica en el perfil personal de LinkedIn de la cuenta que publica.
class PublicacionLinkedinService {
    constructor() {
        this.authRepository = new AuthRepository();
        this.colaboradorService = colaboradorService;
        this.colaboracionRepository = colaboracionRepository;
        this.colectivoRepository = colectivoRepository;
        this.proyectoRepository = proyectoRepository;
        this.palabraBaneadaService = palabraBaneadaService;
        this.linkedinService = linkedinService;
    }

    // Publica el texto en el LinkedIn del usuario. Solo sobre proyectos donde tiene una colaboración activa.
    // Devuelve { idPublicacion, colaboracion } (la colaboración se usa para la auditoría).
    publicar = async (idUsuario, { proyectoId, texto }) => {
        const colaborador = await this.colaboradorService.buscarPorUsuario(idUsuario);
        if (!colaborador) throw new NotFoundError('El usuario no tiene un perfil de colaborador');

        const colaboracion = await this.colaboracionRepository.findActiva(colaborador._id ?? colaborador.id, proyectoId);
        if (!colaboracion)
            throw new ForbiddenError('Solo podés publicar sobre proyectos en los que estás colaborando');

        const idPublicacion = await this.publicarTexto(idUsuario, texto);
        return { idPublicacion, colaboracion };
    }

    // Publica un logro de un proyecto del colectivo que administra el usuario (titular o administrador adicional).
    // Devuelve { idPublicacion, proyecto, logro, colectivo } (para la respuesta y la auditoría).
    publicarLogro = async (idUsuario, { proyectoId, logroId, texto }) => {
        const colectivo = await this.colectivoRepository.findByUsuario(idUsuario);
        if (!colectivo) throw new NotFoundError('El usuario no tiene un colectivo asociado');

        if (!(colectivo.proyectos ?? []).some((p) => idDe(p) === String(proyectoId)))
            throw new ForbiddenError('Solo podés publicar logros de los proyectos de tu organización');

        const proyecto = await this.proyectoRepository.findById(proyectoId);
        if (!proyecto) throw new NotFoundError('Proyecto no encontrado');

        const logro = (proyecto.logros ?? []).find((l) => idDe(l) === String(logroId));
        if (!logro) throw new NotFoundError('Logro no encontrado');

        const idPublicacion = await this.publicarTexto(idUsuario, texto);
        return { idPublicacion, proyecto, logro, colectivo };
    }

    // Revisa palabras prohibidas y publica con el token guardado del usuario
    publicarTexto = async (idUsuario, texto) => {
        const baneadas = await this.palabraBaneadaService.detectar(texto);
        if (baneadas.length > 0)
            throw new BadRequestError('La publicación tiene palabras no permitidas', [
                { path: ['texto'], message: `Sacá estas palabras: ${baneadas.join(', ')}` },
            ]);

        const usuario = await this.authRepository.obtenerUsuarioConTokenLinkedin(idUsuario);
        if (!usuario?.puedePublicarEnLinkedin() || !usuario.linkedin.tokenCifrado)
            throw new LinkedinNoVinculadoError();

        try {
            return await this.linkedinService.publicar(
                descifrar(usuario.linkedin.tokenCifrado),
                usuario.linkedin.sub,
                texto
            );
        } catch (error) {
            // LinkedIn rechazó el token: se borra para que el front pida reconectar
            if (error instanceof LinkedinNoVinculadoError) await this.authRepository.borrarTokenLinkedin(idUsuario);
            throw error;
        }
    }
}

module.exports = new PublicacionLinkedinService();
