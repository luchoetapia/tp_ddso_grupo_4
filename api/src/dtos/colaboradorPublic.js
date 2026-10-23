class ColaboradorPublic {
    constructor(id, nombre, apellido, nombreFantasia, cuentaGit, habilidades, presentacion, deseaSerContactado) {
        this.id = id
        this.nombre = nombre
        this.apellido = apellido
        this.nombreFantasia = nombreFantasia
        this.cuentaGit = cuentaGit
        this.habilidades = habilidades.map(habilidad => {
            return {
                id: habilidad.nombre,
                nombre: habilidad.nombre
            }
        })
        this.presentacion = presentacion
        this.deseaSerContactado = deseaSerContactado
    }
}

module.exports = { ColaboradorPublic }