const mongoose = require('mongoose');
const { TipoCompromiso, ModalidadColaboracion, Proyecto, Periodo, Logro, Perfil } = require('../../models/proyecto');
const Schema = mongoose.Schema;


const tipoCompromisoSchema = new Schema({
    cantHoras: { type: Number, required: true, min: 1 },
    periodo: { type: String, enum: Object.values(Periodo), required: true }
}, { _id: false })


const modalidadColaboracionSchema = new Schema({
    incentivoEconomico: { type: Number, default: 0, min: 0 },
    posibleContratacion: { type: Boolean, default: false }
}, { _id: false })


const logroSchema = new Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true }
}, { timestamps: true, versionKey: false })


const perfilSchema = new Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String },
    habilidadesRequeridas: [{ type: Schema.Types.ObjectId, ref: 'Habilidad' }],
    habilidadesOpcionales: [{ type: Schema.Types.ObjectId, ref: 'Habilidad' }],
    tipoCompromiso: { type: tipoCompromisoSchema, required: true },
    modalidadColaboracion: { type: modalidadColaboracionSchema, required: true },
    busquedaAbierta: { type: Boolean, default: true },
    limiteColaboraciones: { type: Number, min: 1, default: null },
    fechaFinBusqueda: { type: Date, default: null }
}, { timestamps: true, versionKey: false, _id: true })


//TODO: Agregar estrategia Schema.

const proyectoSchema = new Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    perfiles: { type: [perfilSchema], default: [] },
    finalizado: { type: Boolean, default: false },
    porcentajeFinalizado: { type: Number, default: 0, min: 0, max: 100 },
    enlaceSistema: { type: String, default: null },
    enlaceCodigoFuente: { type: String, default: null },
    logros: {type: [logroSchema], default: []}
}, {timestamps: true, versionKey: false});


// findByTitulo
proyectoSchema.index({ titulo: 1 });
// Proyectos activos (obtenerActivos y búsqueda de potenciales proyectos)
proyectoSchema.index({ finalizado: 1 });

// Cargar las clases en los esquemas para que los métodos de instancia estén disponibles
tipoCompromisoSchema.loadClass(TipoCompromiso);
modalidadColaboracionSchema.loadClass(ModalidadColaboracion);
logroSchema.loadClass(Logro);
perfilSchema.loadClass(Perfil);
proyectoSchema.loadClass(Proyecto);

module.exports = mongoose.model('Proyecto', proyectoSchema);