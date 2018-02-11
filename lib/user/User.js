'use strict'

var logger = require('logacious')()
var crypto = require('./crypto.js')
var _ = require('lodash')
var path = require('path')
var DB = require('../DB.js')

const MIN_PASSWORD_LENGTH = 10

function sanitizeUser(user) {
  if(user) {
    delete user.passwordHash
    delete user.passwordSalt
    delete user.passwordIterations
    delete user.passwordKeyLength
    delete user.passwordDigest
    
    delete user.resetToken
    delete user.resetAutomaticLoginToken
    delete user.activationToken
    delete user.activationAutomaticLoginToken
  }
  return user
}

function Client() {
  let conf = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'crow',
    user: process.env.DB_USER || 'crow',
    password: process.env.DB_PWD || 'crow',
    queryDirectory: path.join(__dirname, '..', '..', 'db', 'queries')
  }
  this.pg = DB()
}

Client.prototype.createSession = function(IPAddress, machineID, userId, callback) {
  this.pg.createSession(IPAddress, machineID, userId, (err, result) => {
    if(err) {
      logger.error(err)
      callback(err, null)
    } else if(!result || result.length < 1) {
      err = new Error('Failed to create session. Empty result returned by db.')
      callback(err, null)
    } else {
      callback(null, result[0])
    }
  })
}

/**
 * error codes:
 * - user_inactive
 * - wrong_password
 * - not_found
 */
Client.prototype.authenticate = function(IPAddress, machineID, email, password, callback) {
  logger.info('Authenticating user...', email)
  this.pg.fetchUser(email, (err, result) => {
    if(err) {
      callback(err, null, null)
    } else if(!result || result.length < 1) {
      err = new Error(`Could not find user [${email}]`)
      err.code = 'user_not_found'
      err.statusCode = 404
      callback(err, null, null)
    } else {
      let user = result[0]

      if(!user.active && user.activationToken) {
        err = new Error(`Account has not been validated. Check your email or contact an administrator. [${email}]`)
        err.code = 'user_inactive'
        err.statusCode = 403
        return callback(err, null, null)
      } else if (!user.active) {
        err = new Error(`Account has been locked. Please contact an administrator. [${email}]`)
        err.code = 'user_locked'
        err.statusCode = 403
        return callback(err, null, null)
      }
      
      let hashedPassword = {
        hash: user.passwordHash,
        salt: user.passwordSalt,
        keyLength: user.passwordKeyLength,
        iterations: user.passwordIterations,
        digest: user.passwordDigest
      }
      crypto.verify(password, hashedPassword, (correctPassword) => {
        if(correctPassword) {
          
          this.createSession(IPAddress, machineID, user.id, (err, session) => {
            callback(err, session, sanitizeUser(user))
          })
          
        } else {
          err = new Error(`Wrong password for [${email}]`)
          err.code = 'wrong_password'
          err.statusCode = 400
          if(user.active) {
            this.pg.failedLogin(user.id, (error, result) => {
              if(error) logger.error(error)
              if(result && result[0] && !result[0].active) {
                err = new Error(`Wrong password for [${email}]. Account is locked.`)
                err.code = 'wrong_password_account_has_been_locked'
                err.statusCode = 404
              }
              callback(err, null, null)
            })
          } else {
            callback(err, null, null)
          }
        }
      })
    }
  })
}

Client.prototype.fetchUserFromSession = function(IPAddress, machineID, sessionToken, callback) {
  logger.info('fetchUserFromSession', IPAddress, machineID, sessionToken)
  this.pg.fetchUserFromSession(sessionToken, function(err, result) {
    if(err) {
      callback(err, undefined)
    } else if(!result || result.length < 1) {
      logger.warn('fetchUserFromSession: invalid session', IPAddress, sessionToken)
      callback(null, null)
    } else {
      let user = result[0]
      if(user.active) {
        const token = user.sessionToken
        const expiry = user.sessionExpiry
        delete user.sessionToken
        delete user.sessionExpiry
        callback(null, user, token, expiry)
      } else {
        logger.warn('fetchUserFromSession: user locked', IPAddress, sessionToken)
        err = new Error('User has been locked')
        err.code = 'user_locked'
        err.statusCode = 403
        callback(err, null)
      }
    }
  })
}

Client.prototype.logout = function(sessionToken, callback) {
  this.pg.logout(sessionToken, function(err) {
    if(err) {
      logger.error(err)
    }
    callback()
  })
}

Client.prototype.fetchUserById = function(userID, callback) {
  this.pg.fetchUserById(userID, function(err, result) {
    let user = null
    if(result) {
      user = result[0]
    }
    callback(err, user)
  })
}

Client.prototype.updatePassword = function(IPAddress, machineID, userID, oldPassword, newPassword, callback) {
  logger.info(IPAddress, machineID, 'Changing password for user', userID)
  this.pg.fetchUserById(userID, (err, result) => {
    if(err) {
      callback(err)
    } else if(!result || result.length < 1) {
      err = new Error(`Could not find user [${userID}]`)
      //err.code = 'not_found' DO NOT propagate that error or it'll show up in the UI.
      err.statusCode = 404
      callback(err)
    } else {
      let user = result[0]
      let hashedPassword = {
        hash: user.passwordHash,
        salt: user.passwordSalt,
        keyLength: user.passwordKeyLength,
        iterations: user.passwordIterations,
        digest: user.passwordDigest
      }
      crypto.verify(oldPassword, hashedPassword, (correctPassword) => {
        if(correctPassword) {
          this._updatePassword(userID, newPassword, (err) => {
            callback(err)
          })
        } else {
          err = new Error(`Wrong password for [${userID}]`)
          err.code = 'wrong_password'
          err.statusCode = 400
          callback(err)
        }
      })
    }
  })
}

Client.prototype.updateUser = function(userData, callback) {
  logger.info('Updating user', userData)
  this.pg.updateUser(
    userData.id,
    userData.email,
    userData.firstName,
    userData.lastName,
    userData.company,
    userData.jobTitle,
    userData.location,
    (err) => {
      if(err) {
        callback(err)
      } else {
        logger.info(
          'Updated user ',
          userData.id,
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.company,
          userData.jobTitle,
          userData.location)
        callback(null)
      }
    }
  )
}

Client.prototype._updatePassword = function(userId, password, callback) {
  crypto.hash(password, (err, passwordHashData) => {
    if(err) {
      return callback(err)
    }
    this.pg.updatePassword(
      userId,
      passwordHashData.hash,
      passwordHashData.salt,
      passwordHashData.iterations,
      passwordHashData.keyLength,
      passwordHashData.digest,
      (err, result) => {
        if(err) {
          callback(err)
        } else {
          let userData = result[0]
          logger.info('Updated password for user', userData.id, userData.email)
          callback(null)
        }
      }
    )
  })
}

Client.prototype.setAdmin = function(userId, makeAdmin, callback) {
  if(makeAdmin) {
    this.pg.makeAdmin(userId, (err, result) => {
      if(err) {
        logger.error(err)
      }
      callback(err, result)
    })
  } else {
    this.pg.unmakeAdmin(userId, (err, result) => {
      if(err) {
        logger.error(err)
      }
      callback(err, result)
    })
  }
}


Client.prototype.setActive = function(userId, makeActive, callback) {
  this.pg.setActive(userId, makeActive, (err, result) => {
    if(err) {
      logger.error(err)
    }
    callback(err, result)
  })
}

let client = new Client()

module.exports = function() {
  return client
}