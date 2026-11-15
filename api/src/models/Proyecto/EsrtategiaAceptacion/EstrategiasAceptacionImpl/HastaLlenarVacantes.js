const EstrategiaAceptacion = require('../EstrategiaAceptacion.js');
const EstadoPostulacion = require('../../Postulaciones/EstadoPostulacion.js');

class HastaLlenarVacantes extends EstrategiaAceptacion {
    constructor(proyecto = null) {
        super("HastaLlenarVacantes", proyecto);
    }

    evaluarPostulacion(postulacion) {
        const p = this.proyecto ?? postulacion.proyecto;
        const perfilId = (postulacion.perfil?._id ?? postulacion.perfil?.id ?? postulacion.perfil)?.toString();

        let perfilObj = null;
        if (p?.perfiles) {
            perfilObj = (typeof p.perfiles.id === 'function' 
                ? p.perfiles.id(perfilId) 
                : p.perfiles.find(pf => (pf._id ?? pf.id ?? pf)?.toString() === perfilId)) 
                || (typeof postulacion.perfil === 'object' ? postulacion.perfil : null);
        } else if (typeof postulacion.perfil === 'object') {
            perfilObj = postulacion.perfil;
        }

        const limite = perfilObj?.limiteColaboraciones;
        if (limite == null) {
            return postulacion;
        }

        const todas = p?.postulaciones || [];
        const postulacionesPerfil = todas.filter(post => {
            const pId = (post.perfil?._id ?? post.perfil?.id ?? post.perfil)?.toString();
            return pId === perfilId;
        });

        const yaIncluida = postulacionesPerfil.some(item => 
            (item.id ?? item._id ?? item) === (postulacion.id ?? postulacion._id ?? postulacion)
        );
        if (!yaIncluida) {
            postulacionesPerfil.push(postulacion);
        }

        if (postulacionesPerfil.length < limite) {
            postulacion.estado = EstadoPostulacion.PENDIENTE;
        } else {
            // Se alcanzó el límite: se aceptan todas hasta el límite, se cierra la búsqueda y se rechazan las demás
            postulacionesPerfil.slice(0, limite).forEach(post => {
                post.estado = EstadoPostulacion.ACEPTADA;
            });

            if (perfilObj) {
                perfilObj.busquedaAbierta = false;
            }
            if (postulacion.perfil && typeof postulacion.perfil === 'object') {
                postulacion.perfil.busquedaAbierta = false;
            }

            postulacionesPerfil.slice(limite).forEach(post => {
                post.estado = EstadoPostulacion.RECHAZADA;
            });
        }

        return postulacion;
    }

    aplicableAProyecto(proyecto) {
        const p = proyecto ?? this.proyecto;
        if (!p) return false;
        if (typeof p.tieneLimite === 'function') {
            return p.tieneLimite();
        }
        if (!p.perfiles || p.perfiles.length === 0) return false;
        return p.perfiles.some(perfil => perfil.limiteColaboraciones != null && perfil.limiteColaboraciones > 0);
    }
}

module.exports = HastaLlenarVacantes;
