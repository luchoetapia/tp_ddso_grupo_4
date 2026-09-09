const fs = require('fs')
const path = require('path')
const YAML = require('js-yaml')

const swaggerSpec = YAML.load(fs.readFileSync(path.join(__dirname, '../documentation.yaml'), 'utf8'))

module.exports = { swaggerSpec }
