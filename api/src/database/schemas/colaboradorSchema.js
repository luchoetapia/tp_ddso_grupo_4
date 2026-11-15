const mongoose = require('mongoose');
const { Colaborador } = require('../../models/colaborador')
const { MedioDeContacto } = require('../../models/Contacto');
const Schema = mongoose.Schema;

const valuesMedioDeContacto = Object.values(MedioDeContacto);

const contactoSchema = new Schema({
    medio: { type: String, enum: valuesMedioDeContacto, required: true },
    valor: { type: String, required: true }
});

const colaboradorSchema = new Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
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

// findByCuentaGit
colaboradorSchema.index({ cuentaGit: 1 });
// Búsqueda de colaboradores potenciales por habilidades ($all)
colaboradorSchema.index({ habilidades: 1 });
// Un usuario tiene como máximo un perfil de colaborador (parcial: ignora documentos viejos sin usuario)
colaboradorSchema.index({ usuario: 1 }, { unique: true, partialFilterExpression: { usuario: { $exists: true } } });

colaboradorSchema.loadClass(Colaborador);

module.exports = mongoose.model('Colaborador', colaboradorSchema);