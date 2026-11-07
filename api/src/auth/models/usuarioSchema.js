const mongoose = require('mongoose');
const { Schema } = mongoose;

const { Usuario, roles } = require('./usuario');

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rol: {  type: String, enum: Object.values(roles), required: true },
    activo: { type: Boolean, default: true, required: true },
    ultimoAcceso: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.loadClass(Usuario);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Usuario', userSchema);