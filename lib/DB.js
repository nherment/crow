
const pgJs = require('pg-js')
const conf = require('./conf.js')

module.exports = () => {
  return pgJs(conf.db)
}