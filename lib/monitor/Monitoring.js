

const logger = require('logacious')()
const DB = require('../DB.js')()

function fetchDashboardInformation(callback) {
  DB.fetchDashboardInformation((err, result) => {
    if(err) logger.error(err)
    callback(err, result ? result[0] : null)
  })
}

function deleteMonitor(id, callback) {
  DB.deleteMonitor(id, (err) => {
    callback(err)
  })
}

function fetchMonitors(callback) {
  DB.fetchMonitors((err, monitors) => {
    if(err) logger.error(err)
    callback(err, monitors)
  })
}
function upsertMonitor(monitor, callback) {
  logger.info('upsertMonitor', monitor)
  if(!monitor.id) {
    DB.insertMonitor(
      monitor.name,
      monitor.url,
      monitor.expectedStatusCode,
      monitor.frequencySeconds,
      monitor.validationLogic ? monitor.validationLogic.replace(/^(\n|\s)$/g, '') : null,
      (err, createdMonitor) => {
        if(err) logger.error(err)
        callback(err, createdMonitor)
    })
  } else {
    DB.updateMonitor(
      monitor.id,
      monitor.name,
      monitor.url,
      monitor.expectedStatusCode,
      monitor.frequencySeconds,
      monitor.validationLogic ? monitor.validationLogic.replace(/^(\n|\s)$/g, '') : null,
      (err, updatedMonitor) => {
      if(err) logger.error(err)
      callback(err, updatedMonitor)
    })
  }
}
function fetchHistoricalResponseTime(monitorId, callback) {
  DB.fetchHistoricalResponseTime(monitorId, (err, responseTimes) => {
    if(err) logger.error(err)
    callback(err, responseTimes)
  })
}
module.exports = {
  fetchDashboardInformation,
  fetchMonitors,
  upsertMonitor,
  deleteMonitor
}