const HttpMonitor = require('./HttpMonitor.js')
const DB = require('../DB.js')()
const logger = require('logacious')()

module.exports = () => {
  DB.fetchMonitors((err, monitors) => {
    if(err || !monitors) {
      logger.error(err || new Error('No monitor found in the DB'))
    } else {
      monitors.forEach((monitorData) => {
        let monitor = new HttpMonitor(monitorData)
        monitor.start()
      })
    }
  })
  
}