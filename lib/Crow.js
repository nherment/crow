
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
  if(typeof showProgress === 'boolean') {
    this._showProgress = showProgress
  }
  return this._showProgress
}

Crow.prototype.showIPv4 = function(showIPv4) {
  if(typeof showIPv4 === 'boolean') {
    this._showIPv4 = showIPv4
  }
  return this._showIPv4
}

Crow.prototype.showIPv6 = function(showIPv6) {
  if(typeof showIPv6 === 'boolean') {
    this._showIPv6 = showIPv6
  }
  return this._showIPv6
}

Crow.prototype.remotes = function() {
  return this._remotes
}

Crow.prototype.run = function(callback) {
  var self = this

  var callbackReceivedCount = 0

  var allPass = true

  for(var i = 0 ; i < self.remotes().length ; i++) {

    self.remotes()[i].test(function(result) {

      allPass = allPass && result.success

      callbackReceivedCount ++
      if(self.showProgress()) {
        process.stdout.write('.')
      }

      if(callbackReceivedCount === self.remotes().length) {

        if(self.showProgress()) {
          process.stdout.write('\n')
        }
        self._result = ResultPrinter.stringifyLastResults({
            showIPv4: self.showIPv4(),
            showIPv6: self.showIPv6()
          },
          self.remotes()
        )

        if(callback) {
          callback(self._result, allPass)
        }
      }

    })
  }

}



module.exports = Crow
