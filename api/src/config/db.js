const mongoose = require('mongoose');

async function connectDB() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('Falta la variable de entorno MONGODB_URI');
    }

    await mongoose.connect(uri);
    console.log('Conectado a MongoDB');
}

module.exports = connectDB;
