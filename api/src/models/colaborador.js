class Colaborador {
    constructor(nombre, apellido, nombreFantasia, cuentaGit, habilidades, pronombres, presentacion, deseaSerContactado, contactos) {
        this.nombre = nombre
        this.apellido = apellido
        this.nombreFantasia = nombreFantasia
        this.cuentaGit = cuentaGit
        this.habilidades = habilidades
        this.pronombres = pronombres
        this.presentacion = presentacion
        this.deseaSerContactado = deseaSerContactado
        this.contactos = contactos
    }
}

module.exports = { Colaborador }