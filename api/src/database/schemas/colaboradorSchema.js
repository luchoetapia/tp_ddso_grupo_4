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
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    nombreFantasia: { type: String, default: null },
    cuentaGit: { type: String, required: true },
    pronombres: { type: String, default: null },
    habilidades: [{ type: Schema.Types.ObjectId, ref: 'Habilidad' }],
    presentacion: { type: String, default: null },
    deseaSerContactado: { type: Boolean, default: false },
    contactos: { type: [contactoSchema], default: [] }
}, {
    timestamps: true,
    versionKey: false
});

colaboradorSchema.loadClass(Colaborador);

module.exports = mongoose.model('Colaborador', colaboradorSchema);