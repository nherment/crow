const HttpMonitor = require('./HttpMonitor.js')
const DB = require('../DB.js')()
const logger = require('logacious')()

let runningMonitors = []

function scheduleNextRefresh() {
  setTimeout(refreshMonitors, 10000)
}

function refreshMonitors() {
  logger.info('Refreshing active monitors')
  DB.fetchMonitors((err, monitors) => {
    if(err) {
      logger.error(err)
    } else {
      runningMonitors = runningMonitors.filter((httpMonitor) => {
        let monitor = monitors.find((monitor => monitor.id == httpMonitor.monitor.id))
        if(monitor) {
          httpMonitor.monitor = monitor
          return true
        } else {
          logger.info('Stopping monitor', httpMonitor.monitor.id, httpMonitor.monitor.name)
          httpMonitor.stop()
          return false
        }
      })
      monitors.forEach(monitor => {
        let httpMonitor = runningMonitors.find((httpMonitor => monitor.id == httpMonitor.monitor.id))
        if(!httpMonitor) {
          logger.info('Starting monitor', monitor.id, monitor.name)
          httpMonitor = new HttpMonitor(monitor)
          httpMonitor.start()
          runningMonitors.push(httpMonitor)
        }
      })
    }
    scheduleNextRefresh()
  })
}


module.exports = () => {
  refreshMonitors()
}