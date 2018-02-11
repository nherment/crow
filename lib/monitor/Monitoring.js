

const logger = require('logacious')()
const DB = require('../DB.js')()

function fetchDashboardInformation(callback) {
  DB.fetchDashboardInformation((err, result) => {
    if(err) logger.error(err)
    callback(err, result ? result[0] : null)
  })
}
module.exports = {
  fetchDashboardInformation
}