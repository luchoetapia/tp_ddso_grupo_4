import { notFoundHandler } from "./middlewares/notFoundHandler.js"
import { errorLogger } from "./middlewares/errorLogger.js"
import { errorHandler } from "./middlewares/errorHandler.js"

require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const connectDB = require("./src/config/db.js");
const router = require("./src/routers/router.js");

app.use(express.json());
app.use(router);
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('¡Hola Mundo!');
});

app.get("/healthcheck", (request, response) => {
    response.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
    })
})

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo conectar a MongoDB:', error.message);
    process.exit(1);
  });

module.exports = app;
