const mongoose = require('mongoose');
const { Schema } = mongoose;

const { Usuario, roles } = require('./models/usuario');

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rol: {  type: String, enum: Object.values(roles), required: true },
    activo: { type: Boolean, default: true, required: true },
    ultimoAcceso: { type: Date, default: new Date() },
}, { timestamps: true });

userSchema.loadClass(Usuario);
userSchema.index({ username: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);