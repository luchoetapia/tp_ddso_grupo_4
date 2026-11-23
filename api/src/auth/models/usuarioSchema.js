const mongoose = require('mongoose');
const { Schema } = mongoose;

const { Usuario, roles } = require('./usuario');

const linkedinSchema = new Schema({
    sub: { type: String, required: true },
    nombre: { type: String, default: null },
    apellido: { type: String, default: null },
    foto: { type: String, default: null },
}, { _id: false });

const userSchema = new Schema({
    username: { type: String, required: true },
    password: {
        type: String,
        default: null,
        required: function () { return this.activo && !this.linkedin?.sub }, // Obligatoria si no se registra mediante linkedin
    },
    
    email: { type: String, required: true, lowercase: true, trim: true },
    rol: {  type: String, enum: Object.values(roles), required: true },
    activo: { type: Boolean, default: true, required: true },
    ultimoAcceso: { type: Date, default: Date.now },
    linkedin: { type: linkedinSchema, default: undefined },
}, { timestamps: true });

userSchema.loadClass(Usuario);

// Únicos solo entre cuentas activas: desactivar una cuenta libera su username y email.
userSchema.index({ username: 1 }, { unique: true, partialFilterExpression: { activo: true } });
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { activo: true } });
// Una cuenta de LinkedIn queda asociada a lo sumo a un usuario activo
userSchema.index(
    { 'linkedin.sub': 1 },
    { unique: true, partialFilterExpression: { activo: true, 'linkedin.sub': { $exists: true } } }
);

module.exports = mongoose.model('Usuario', userSchema);