const mongoClient = require("./src/database/mongoose.js");

require('dotenv').config();

const app = require("./src/app.js");
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Servidor en http://localhost:${PORT}`);

    try {
        await mongoClient.connect();
    }
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
});

module.exports = app;
