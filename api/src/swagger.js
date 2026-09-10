const fs = require('fs')
const path = require('path')
const YAML = require('js-yaml')

const swaggerSpec = YAML.load(fs.readFileSync(path.join(__dirname, '../documentation.yaml'), 'utf8'))
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API TP DDSO',
            version: '1.0.0',
            description: 'Documentación de la API',
        },
    },
    apis: ['./src/routers/*.js', './src/routes/*.js']
}

module.exports = { swaggerSpec, swaggerOptions }
