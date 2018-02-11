const logger = require('logacious')()

class IntervalCaller {


  constructor() {
    this._intervalMilliseconds = 60 * 1000
    this._execute = this._execute.bind(this)
  }

  intervalSeconds(interval) {
    if(interval) {
      this._intervalMilliseconds = interval * 1000
    }
    return this
  }

  setFunction(func) {
    this._func = func
    return this
  }

  start() {
    this._stopped = false
    this._run()
    return this
  }

  _run() {
    if(!this._stopped && this._func && this._intervalMilliseconds > 0 && !this._timeout) {
      if(this._lastRun) {
        let delaySinceLastRun = Date.now() - this._lastRun
        let delayToNextRun = delaySinceLastRun < this._intervalMilliseconds ? this._intervalMilliseconds - delaySinceLastRun : 0
        this._timeout = setTimeout(this._execute, delayToNextRun)
      } else {
        this._timeout = setTimeout(this._execute, 0)
      }
      
    } else if(this._timeout) {
      logger.info('IntervalCaller will not run')
    }
  }
  _execute() {
    this._lastRun = Date.now()
    this._func.call(null, () => {
      clearTimeout(this._timeout)
      delete this._timeout
      this._run()
    })
  }

  stop() {
    if(this._timeout) {
      clearTimeout(this._timeout)
    }
    this._stopped = true
    return this
  }

}

module.exports = {
  create: () => {
    return new IntervalCaller
  }
}