
var cookieParser = require('cookie-parser')
var logger = require('logacious')()
var user = require('../user/User.js')

var secret = require('../conf.js').cookieSecret

var isProduction = require('../conf.js').isProduction

// do not set a random secret in prod. With no secret
// the app should crash
if(!secret && !isProduction) {
  logger.warn('Using unsecure cookies (secret)')
  secret = 'caramel'
}

function setupSessions(app) {
  
  app.use(cookieParser())
  app.use((req, res, next) => {
    req.session = {}
    req.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    if(req.cookies['crow-session']) {
      req.session.token = req.cookies['crow-session']
    }
    res.setSessionToken = function(token, expiry) {
      res.cookie('crow-session', token, {
        secure: isProduction,
        httpOnly: true,
        expires: expiry
      })
    }
    res.deleteSession = function() {
      res.clearCookie('crow-session')
    }
    next()
  })
}

function pullUserFromSession(app) {
  app.use(function(req, res, next) {
    if(req.session && req.session.token && !req.user) {
      user.fetchUserFromSession(req.session.token, function(err, user, token, expiry) {
        if(err) {
          res.error(err)
        } else if(user) {
          req.user = user
          res.locals.user = user
          
          res.cookie('crow-session', token, {
            secure: isProduction,
            httpOnly: true,
            expires: expiry
          })
          
        } else {
          res.deleteSession()
        }
        next()
      })
    } else if(req.session && req.user) { // user already loaded
      next()
    } else {
      next()
    }
  })
}

function requireAuth(app) {
  app.use(function(req, res, next) {
    if(req.session && req.session.token && !req.user) {
      user.fetchUserFromSession(req.session.token, function(err, user) {
        if(err) {
          res.error(err)
        } else if(user) {
          req.user = user
          res.locals.user = user
          next()
        } else {
          res.deleteSession()
          if(req.headers['accept'] === 'application/json') {
            res.status(401).send({error: {message: 'Authentication required'}})
          } else {
            res.status(401).redirect('/login')
          }
        }
      })
    } else if(req.session && req.user) { // user already loaded
      next()
    } else {
      if(req.headers['accept'] === 'application/json') {
        res.status(401).send({error: {message: 'Authentication required'}})
      } else {
        res.status(401).redirect('/login')
      }
    }
  })
}

function requireAdmin(app) {
  app.use(function(req, res, next) {
    // this middleware is run after requireAuth so we don't need to fetch the user again
    if(req.user && req.user.isAdmin) {
      next()
    } else {
      res.status(404).send('not found')
    }
  })
}

module.exports = {
  setupSessions,
  requireAuth,
  requireAdmin,
  pullUserFromSession
}