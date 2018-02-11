
var isProduction = require('../conf.js').isProduction

var errorResponse

if(isProduction) {
  errorResponse = function(req, res, next) {
    res.error = function(err) {
      res.status(err.statusCode || 500)
        .send({
          message: err.message
        })
    }
    next()
  }
} else {
  errorResponse = function(req, res, next) {
    res.error = function(err) {
      res.status(err.statusCode || 500)
        .send({
          message: err.message,
          stack: err.stack
        })
    }
    next()
  }
}

function enrichContext(req, res, next) {
  req.ctx = {
    ip: req.ip,
    user: req.user,
    sessionToken: req.session ? req.session.token : null
  }
  next()
}

let templates = {
  notFound: function() {
    this.render('404', {})
  }
}

function templateShortcuts (req, res, next) {
  res.notFound = templates.notFound
  next()
}

module.exports = {
  errorResponse,
  enrichContext,
  templateShortcuts
}