const mongoose = require('mongoose');
const { Colaborador } = require('../../models/dominio')
const MedioDeContacto = require('../../models/Contacto/MedioDeContacto');
const Schema = mongoose.Schema;

const valuesMedioDeContacto = Object.values(MedioDeContacto);

const contactoSchema = new Schema({
    medio: { type: String, enum: valuesMedioDeContacto, required: true },
    valor: { type: String, required: true }
});

const colaboradorSchema = new Schema({
    nombre: { type: String, default: null},
    apellido: { type: String, default: null },
    nombreFantasia: { type: String, required: true},
    cuentaGit: { type: String,  required: true },
    pronombres: [{ type: String, ref: 'Proyecto', default: null}],
    habilidades: [{ type: Schema.Types.ObjectId, required: true, ref: 'Habilidad' }],
    presentacion: {type: String},
    deseaSerContactado: {type: Boolean},
    contactos: { type: [contactoSchema], default: [] }
}, {
    timestamps: true,
    versionKey: false
});

colaboradorSchema.loadClass(Colaborador);

module.exports = mongoose.model('Colaborador', colaboradorSchema);