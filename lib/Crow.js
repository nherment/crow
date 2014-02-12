
var Remote        = require('./Remote.js')
var ResultPrinter = require('./ResultPrinter.js')

function Crow(remotesConfigs) {

  this._remotes = [];


  for(var i = 0 ; i < remotesConfigs.length ; i++) {

    var remoteConfig = remotesConfigs[i]

    var remote = new Remote()

    remote.protocol(remoteConfig.protocol)
    remote.domain(remoteConfig.domain)
    remote.port(remoteConfig.port)
    remote.path(remoteConfig.path)

    remote.method(remoteConfig.method)
    remote.headers(remoteConfig.headers)
    if(typeof remoteConfig.body === 'string') {
      remote.body(remoteConfig.body)
    } else {
      remote.body(JSON.stringify(remoteConfig.body))
    }

    this._remotes.push(remote)
  }

}

Crow.prototype.showProgress = function(showProgress) {
  this._showProgress = !!showProgress
  return this._showProgress
}

Crow.prototype.remotes = function() {
  return this._remotes
}

Crow.prototype.run = function(callback) {
  var self = this

  var callbackReceivedCount = 0

  var allPass = true

  for(var i = 0 ; i < self._remotes.length ; i++) {

    self._remotes[i].test(function(result) {

      allPass = allPass && result.success

      callbackReceivedCount ++
      if(self._showProgress) {
        process.stdout.write('.')
      }

      if(callbackReceivedCount === self._remotes.length) {

        if(self._showProgress) {
          process.stdout.write('\n')
        }
        self._result = ResultPrinter.stringifyLastResults(self._remotes)
        if(callback) {
          callback(self._result, allPass)
        }
      }

    })
  }

}



module.exports = Crow
