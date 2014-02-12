
var request = require('request')
var _       = require('underscore')

function Remote() {
  this._domain = 'localhost'
  this._path = '/'
  this._port = 80
  this._protocol = 'http'
  this._method = 'GET'
  this._body = undefined
  this._headers = {}
  this._history = []
  this._validStatus = {
    codes: [200],
    body: null
  }
}

Remote.prototype.validStatus = function(validStatus) {
  if(validStatus) {
    this._validStatus = validStatus
  }
  return this._validStatus
}

Remote.prototype.test = function(callback) {

  var requestTimestamp = Date.now()
  var self = this
  request({
    url: self.fullUrl(),
    method: self.method(),
    headers: self.headers(),
    body: self.body()
  }, function (error, incomingMessage, body) {

    var now = Date.now()

    var result = {
      success: true,
      delay: (now - requestTimestamp),
      request: {
        time: requestTimestamp,
        url: self.fullUrl(),
        method: self.method(),
        headers: self.headers(),
        body: self.body()
      },
      response: {
        time: now,
        error: error,
        headers: incomingMessage ? incomingMessage.headers : null,
        body: body,
        statusCode: incomingMessage ? incomingMessage.statusCode : null
      }
    }

    result.success = verify(self.validStatus(), result)

    self._history.push(result)

    if(callback) {
      callback(result)
    }
  })

}

function verify(validStatus, actualResult) {

  if(validStatus.codes && validStatus.codes.length > 0) {
    if(validStatus.codes.indexOf(actualResult.response.statusCode) === -1) {
      return false
    }
  }

  if(validStatus.body) {
    return _.equal(validStatus.body, actualResult.response.body)
  }

  return true

}

//--------------------------------------------------------//
//--                  getters / setters                 --//

Remote.prototype.path = function(path) {
  if(path) {
    this._path = path
  }
  return this._path
}

Remote.prototype.domain = function(domain) {
  if(domain) {
    this._domain = domain
  }
  return this._domain
}

Remote.prototype.protocol = function(protocol) {
  if(protocol) {
    this._protocol = protocol
  }
  return this._protocol
}

Remote.prototype.port = function(port) {
  if(port) {
    this._port = port
  }
  return this._port
}

Remote.prototype.fullUrl = function() {
  return this._protocol + "://" + this._domain + ':' + this._port + this._path
}

Remote.prototype.method = function(method) {
  if(method) {
    this._method = method
  }
  return this._method
}

Remote.prototype.headers = function(headers) {
  if(headers) {
    this._headers = headers
  }
  return this._headers
}

Remote.prototype.body = function(body) {
  if(body) {
    this._body = body
  }
  return this._body
}

Remote.prototype.name = function(name) {
  if(name) {
    this._name = name
  }
  return this._name
}

Remote.prototype.lastResult = function() {
  if(this._history.length > 0) {
    return this._history[this._history.length -1]
  }
}

//--                  getters / setters                 --//
//--------------------------------------------------------//


module.exports = Remote
