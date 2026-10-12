const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

class MongoDatabase {
    async connect() {
        await mongoose.connect(mongoUri, {
            dbName: dbName,
        });

        console.log("Connected to MongoDB");
    }

    async close() {
        await mongoose.connection.close();
        console.log("Disconnected from MongoDB");
    }
}

module.exports = new MongoDatabase();