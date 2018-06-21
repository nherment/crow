
var app = require('express').Router()
var logger = require('logacious')()

var template = require('../../views/index/index.marko')
var Monitoring = require('../monitor/Monitoring.js')
var User = require('../user/User.js')

app.get('/', function(req, res) {
  Monitoring.fetchDashboardInformation((err, data) => {
    res.marko(template, Object.assign({
      err, 
      page: 'home',
      user: req.user
    }, data))
  })
})
app.post('/login', function(req, res) {
  User.authenticate(req.body.email, req.body.password, (err, session) => {
    if(err) {
      res.send(err.message)
    } else if(session) {
      res.setSessionToken(session.token, session.expiry)
      res.redirect('/')
    } else {
      res.redirect('/?session_creation_failed')
    }
  })
})


module.exports = app