var crypto = require('crypto')
var logger = require('logacious')()

var DIGEST = 'sha512'
var ITERATIONS = 100 * 1000 // NOT LOWER THAN 20000 !!
var KEY_LENGTH = 512

function hash(plainText, callback) {

  if(!plainText) {
    let err = new Error('The password is invalid. It can\'t be falsy.')
    err.statusCode = 400
    return callback(err, null)
  }

  crypto.randomBytes(KEY_LENGTH, function(err, salt) {
    if (err) {
      logger.error(err)
      callback(err, undefined)
    } else {
      crypto.pbkdf2(
        plainText,
        salt,
        ITERATIONS,
        KEY_LENGTH,
        DIGEST,
        function(err, hash) {
          if(err) {
            logger.error(err)
            callback(err, null)
          } else {
            var passwordHash = {
              salt: salt.toString('hex'),
              keyLength: KEY_LENGTH,
              iterations: ITERATIONS,
              hash: hash.toString('hex'),
              digest: DIGEST
            }
            callback(null, passwordHash)
          }
        }
      )
    }
  })
}

function randomString(length, callback) {
  crypto.randomBytes(Math.ceil(length/2), function(err, salt) {
    if (err) {
      logger.error(err)
      callback(err, null)
    } else {
      callback(null, salt.toString('hex').substr(0, length))
    }
  })
}

function verify(plainText, passwordHash, callback) {

  if(typeof plainText == 'undefined') {
    return callback(null, false)
  }

  crypto.pbkdf2(
    plainText,
    new Buffer(passwordHash.salt, 'hex'),
    passwordHash.iterations,
    passwordHash.keyLength,
    passwordHash.digest,
    function(err, hash) {
      if(err) {
        logger.error(err)
        callback(false)
      } else {
        callback(hash.toString('hex') === passwordHash.hash)
      }
    }
  )
}

module.exports = {
  hash,
  verify,
  randomString
}