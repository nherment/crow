const IntervalCaller = require('./IntervalCaller.js')
const checkHttpEndpoint = require('./HttpCheck.js').checkHttpEndpoint
const logger = require('logacious')()
const DB = require('../DB.js')()
const Notification = require('../notification/Notification.js')
const {NodeVM, VMScript} = require('vm2')

class HttpMonitor {
  
  constructor(monitor) {
    this.monitor = monitor
    this._setup()
  
  }
  _setup() {
    this._intervalCaller = IntervalCaller.create()
    this.refresh()
    
    this._intervalCaller.setFunction((callback) => {
      logger.info(`Checking monitor [${this.monitor.name}] at [${this.monitor.url}]`)
      checkHttpEndpoint(this.monitor.url, this.monitor.expectedStatusCode, (result) => {

        if(result.ok && this.monitor.validationLogic) {
          try {
            if(this.monitor.validationLogic && !this._vm) {
              this._vm = new NodeVM({
                console: 'off',
                timeout: 100,
                sandbox: {}
              });
            }
            let validateBody = this._vm.run(`module.exports = function(body) {${this.monitor.validationLogic}}`)
            if(validateBody) {
              let validationResult = validateBody(result.body)
              if(validationResult !== true) {
                logger.info('Body validation failed for', this.monitor.name, validationResult)
                result.ok = false
                result.message = `Data validation failed: ${validationResult}`
              }
            }
          } catch(err) {
            logger.error('Body validation error', this.monitor.name, err)
            result.ok = false
            result.message = err.message
          }
        }

        DB.insertMonitorCheck(this.monitor.id, 
                              result.ok,  
                              result.ok ? result.delayMs : null, // do not log delay MS if the endpoint could not be contacted)
                              result.message, (err, updatedFailureReports) => {
                                if(err) logger.error(err)
                                if(updatedFailureReports && updatedFailureReports[0]) {
                                  let failureReport = updatedFailureReports[0]
                                  let message = `${this.monitor.name} `
                                  if(failureReport.closedDate) {
                                    message += 'fixed'
                                  } else {
                                    message += `FAILURE\n${failureReport.details}`
                                    Notification.notifyBySMS(message, (err) => {
                                      logger.error(err)
                                      callback()
                                    })
                                  }
                                  Notification.notifyByMail(`Monitoring update - ${this.monitor.name}`, message, (err) => {
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

  refresh() {
    this._intervalCaller.intervalSeconds(this.monitor.frequencySeconds)
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

