const mongoose = require('mongoose');
const { Colaborador } = require('../../models/dominio')
const { MedioDeContacto } = require('../../models/Contacto/MedioDeContacto');
const Schema = mongoose.Schema;

const valuesMedioDeContacto = Object.values(MedioDeContacto);

const colaboradorSchema = new Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, default: "" },
    nombreFantasia: { type: String, default: null },
    cuentaGit: { type: String, enum: valuesTipocolaborador, required: true },
    pronombres: [{ type: Schema.Types.ObjectId, ref: 'Proyecto' }],
    habilidades: [{ type: [Schema.Types.ObjectId], required: true, ref: 'Habilidad' }],
    presentacion: {type: String},
    deseaSerContactado: {type: Boolean},
    notificaciones: [{ type: [Schema.Types.ObjectId], required: true, ref: 'Notificacion' }],
    contactos: [{type: {
        medio: {type: String, enum: valuesMedioDeContacto}
        //TODO
    }}]
}, {
    timestamps: true,
    versionKey: false,
})

colaboradorSchema.loadClass(Colaborador);

module.exports = mongoose.model('Colaborador', colaboradorSchema);