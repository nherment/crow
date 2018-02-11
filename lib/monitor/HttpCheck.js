
const request = require('request')
const logger = require('logacious')()

function checkHttpEndpoint(url, expectedStatusCode, callback) {
  var certificate
  var startTime = Date.now()
  request(url, function (error, response, body) {
    var checkResult = {
      ok: true,
      message: null,
      delayMs: Date.now() - startTime
    }
    if(error) {
      checkResult.message = error.message
      checkResult.ok = false
    } else if(response.statusCode !== expectedStatusCode) {
      checkResult.message = `Wrong status code. Expected ${expectedStatusCode} but got ${response.statusCode}`
      checkResult.ok = false
    }
    callback(checkResult)
  })
  /*r.on('response', function(res) {
    certificate = res.req.socket.getPeerCertificate()
    console.log('cert', certificate)
  })*/
}

module.exports = {
  checkHttpEndpoint
}