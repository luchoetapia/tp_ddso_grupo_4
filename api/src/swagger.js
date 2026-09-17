const fs = require('fs')
const path = require('path')
const YAML = require('js-yaml')

const swaggerSpec = YAML.load(fs.readFileSync(path.join(__dirname, '../documentation.yaml'), 'utf8'))
const swaggerOptions = {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js'
    ]
}

module.exports = { swaggerSpec, swaggerOptions }
