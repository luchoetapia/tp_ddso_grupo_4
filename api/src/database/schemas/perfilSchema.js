const mongoose = require('mongoose');
const { Periodo} = require('../../models/dominio');
const  Perfil  = require('../../models/perfil');
const Schema = mongoose.Schema;

const valuesPeriodo = Object.values(Periodo);

const tipoCompromisoSchema = new Schema({
    cantHoras: { type: Number, required: true },
    periodo: { type: String, enum: valuesPeriodo, required: true }
}, 
{ _id: false });

const modalidadColaboracionSchema = new Schema({
    incentivoEconomico: { type: Number, default: 0 },
    posibleContratacion: { type: Boolean, default: false }
},
{ _id: false });

const perfilSchema = new Schema({
    descripcion: { type: String },
    habilidadesRequeridas: [{ type: Schema.Types.ObjectId, ref: 'Habilidad' }],
    habilidadesOpcionales: [{ type: Schema.Types.ObjectId, ref: 'Habilidad' }],
    tipoCompromiso: { type: tipoCompromisoSchema, required: true },
    modalidadColaboracion: { type: modalidadColaboracionSchema, required: true }
}, {
    timestamps: true,
    versionKey: false
});

perfilSchema.loadClass(Perfil);

module.exports = mongoose.model('Perfil', perfilSchema);