const mongoose = require('mongoose');
const { TipoCompromiso, ModalidadColaboracion, Proyecto, Periodo } = require('../../models/dominio');
const Logro = require('../../models/Logro')
const Schema = mongoose.Schema;

const tipoCompromisoSchema = new Schema({
    cantHoras: { type: Number, required: true },
    periodo: { type: String, enum: Object.values(Periodo), required: true }
}, { _id: false })
tipoCompromisoSchema.loadClass(TipoCompromiso);

const modalidadColaboracionSchema = new Schema({
    incentivoEconomico: { type: Number, default: 0 },
    posibleContratacion: { type: Boolean, default: false }
}, { _id: false })
modalidadColaboracionSchema.loadClass(ModalidadColaboracion);

const logroSchema = new Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true }
}, { timestamps: true, versionKey: false })
logroSchema.loadClass(Logro);

const proyectoSchema = new Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, default: "" },
    habilidades: [{ type: Schema.Types.ObjectId, ref: 'Habilidad' }],
    tipoCompromiso: { type: tipoCompromisoSchema, required: true },
    modalidadColaboracion: { type: modalidadColaboracionSchema, required: true },
    finalizado: { type: Boolean, default: false },
    porcentajeFinalizado: { type: Number, default: 0 },
    enlaceSistema: { type: String, default: null },
    enlaceCodigoFuente: { type: String, default: null },
    logros: {type: [logroSchema], default: []}
}, {timestamps: true, versionKey: false});

proyectoSchema.loadClass(Proyecto);

module.exports = mongoose.model('Proyecto', proyectoSchema);