const IntervalCaller = require('./IntervalCaller.js')
const checkHttpEndpoint = require('./HttpCheck.js').checkHttpEndpoint
const logger = require('logacious')()
const DB = require('../DB.js')()
const Notification = require('../notification/Notification.js')

class HttpMonitor {
  
  constructor(monitorData) {
    this._intervalCaller = IntervalCaller.create()
      .intervalSeconds(monitorData.frequencySeconds)
      .setFunction((callback) => {
        logger.info(`Checking monitor [${monitorData.name}] at [${monitorData.url}]`)
        checkHttpEndpoint(monitorData.url, monitorData.expectedStatusCode, (result) => {
          logger.info(monitorData.name, result.ok ? 'ok' : result.message)
          DB.insertMonitorCheck(monitorData.id, 
                                result.ok,  
                                result.ok ? result.delayMs : null, // do not log delay MS if the endpoint could not be contacted)
                                result.message, (err, updatedFailureReports) => {
                                  if(err) logger.error(err)
                                  if(updatedFailureReports && updatedFailureReports[0]) {
                                    let failureReport = updatedFailureReports[0]
                                    let message = `${monitorData.name} `
                                    if(failureReport.closedDate) {
                                      message += 'fixed'
                                    } else {
                                      message += `FAILURE\n${failureReport.details}`
                                      Notification.notifyBySMS(message, (err) => {
                                        logger.error(err)
                                        callback()
                                      })
                                    }
                                    Notification.notifyByMail(`Monitoring update - ${monitorData.name}`, message, (err) => {
                                      logger.error(err)
                                      callback()
                                    })
                                  } else {
                                    callback()
                                  }
                                })
        })
      })
  }

  start() {
    this._intervalCaller.start()
    return this
  }

  stop() {
    this._intervalCaller.stop()
    return this
  }
}

module.exports = HttpMonitor

