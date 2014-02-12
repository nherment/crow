
var Crow = require('../index.js')

describe('basic tests', function() {

  it('on google should report all ok', function(done) {
    this.timeout(30000)

    var crow = new Crow([
      {
        protocol: 'https',
        domain: 'google.com',
        port: 443,
        path: '/'
      }, {
        protocol: 'http',
        domain: 'google.com',
        port: 80,
        path: '/'
      }, {
        protocol: 'https',
        domain: 'arkhaios.net',
        port: 443,
        path: '/'
      }, {
        protocol: 'http',
        domain: 'nowhere',
        port: 80,
        path: '/'
      }, {
        protocol: 'https',
        domain: 'elipsis.io',
        port: 443,
        path: '/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          email: 'hello@elipsis.io',
          password: '123456'
        }
      }
    ])

    crow.run(function(str) {
      console.log('') // mocha prints without ending with \n
      console.log(str)
      done()
    })


  })


})