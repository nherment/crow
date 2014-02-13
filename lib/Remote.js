
var request = require('request')
var _       = require('underscore')
var dns     = require('dns');
var Step    = require('step');

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

    Step(
      function () {

        var done = this.parallel()

        self.retrieveIPv4Addresses(function (err, addresses) {

          if(err) {
            result.ipv4Addresses = err.message
          } else if(addresses) {
            result.ipv4Addresses = addresses.join(', ')
          }

          done()

        })
      },
      function () {

        var done = this.parallel()

        Remote.prototype.retrieveIPv6Addresses(function(err, addresses) {

          if(err) {
            result.ipv6Addresses = err.message
          } else if(addresses) {
            result.ipv6Addresses = addresses.join(', ')
          }

          done()

        })
      },
      function () {

        if(callback) {
          callback(result)
        }
      }
    );


    self.retrieveIPv4Addresses(function (err, addresses) {

      if(err) {
        result.ipAddresses = err.message
      } else if(addresses) {
        result.ipAddresses = addresses.join(', ')
      }

    })
  })

}

Remote.prototype.retrieveIPv4Addresses = function(callback) {

  dns.resolve4(this.domain(), function (err, addresses) {

    if(addresses && addresses.length > 0) {
      callback(undefined, addresses)
    } else if(err) {
      callback(err, undefined)
    } else {
      callback(new Error('unknown'), undefined)
    }

  })

}

Remote.prototype.retrieveIPv6Addresses = function(callback) {

  dns.resolve4(this.domain(), function (err, addresses) {

    if(addresses && addresses.length > 0) {
      callback(undefined, addresses)
    } else if(err) {
      callback(err, undefined)
    } else {
      callback(new Error('unknown'), undefined)
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
  if((this.protocol() === 'https' && this.port() === 443) || (this.protocol() === 'http' && this.port() === 80)) {
    return this.protocol() + "://" + this.domain() + this.path()
  } else {
    return this.protocol() + "://" + this.domain() + ':' + this.port() + this.path()
  }
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
