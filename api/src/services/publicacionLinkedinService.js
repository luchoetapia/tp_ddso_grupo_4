const AuthRepository = require('../auth/authRepository.js');
const colaboradorService = require('./colaboradorService.js');
const colaboracionRepository = require('../repositories/colaboracionRepository.js');
const palabraBaneadaService = require('./palabraBaneadaSevice.js');
const linkedinService = require('../linkedin/linkedinService.js');
const { LinkedinNoVinculadoError } = require('../linkedin/linkedinService.js');
const { descifrar } = require('../linkedin/cifrado.js');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../errors/AppError.js');

// Publicaciones en LinkedIn de colaboradores sobre los proyectos en los que participan
class PublicacionLinkedinService {
    constructor() {
        this.authRepository = new AuthRepository();
        this.colaboradorService = colaboradorService;
        this.colaboracionRepository = colaboracionRepository;
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

        const baneadas = await this.palabraBaneadaService.detectar(texto);
        if (baneadas.length > 0)
            throw new BadRequestError('La publicación tiene palabras no permitidas', [
                { path: ['texto'], message: `Sacá estas palabras: ${baneadas.join(', ')}` },
            ]);

        const usuario = await this.authRepository.obtenerUsuarioConTokenLinkedin(idUsuario);
        if (!usuario?.puedePublicarEnLinkedin() || !usuario.linkedin.tokenCifrado)
            throw new LinkedinNoVinculadoError();

        try {
            const idPublicacion = await this.linkedinService.publicar(
                descifrar(usuario.linkedin.tokenCifrado),
                usuario.linkedin.sub,
                texto
            );
            return { idPublicacion, colaboracion };
        } catch (error) {
            // LinkedIn rechazó el token: se borra para que el front pida reconectar
            if (error instanceof LinkedinNoVinculadoError) await this.authRepository.borrarTokenLinkedin(idUsuario);
            throw error;
        }
    }
}

module.exports = new PublicacionLinkedinService();
