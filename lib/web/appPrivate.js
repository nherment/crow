
const app = require('express').Router()
const logger = require('logacious')()

const auth = require('./middlewareAuth.js')
const User = require('../user/User.js')
const Monitoring = require('../monitor/Monitoring.js')
const template = require('../../views/index/index.marko')

auth.requireAuth(app)

app.get('/logout', function(req, res) {
  res.deleteSession()
  User.logout(req.session.token, () => {
    res.redirect('/')
  })
})

app.get('/account', function(req, res) {
  res.marko(template, {
    page: 'account'
  })
})

app.get('/settings', function(req, res) {
  Monitoring.fetchMonitors((err, monitors) => {
    res.marko(template, {
      page: 'settings',
      err, 
      monitors
    })
  })
})

app.get('/response-times/:monitorId', function(req, res) {
  Monitoring.fetchHistoricalResponseTime(req.params.id, (err, data) => {
    if(err) res.error(err)
    else res.send(data)
  })
})

app.post('/update-password', function(req, res) {
  User.updatePassword(req.user.id, req.body.oldPassword, req.body.newPassword, (err) => {
    if(err) {
      logger.error(err)
      res.redirect(`/settings?err=${err.message}`)
    } else {
      res.redirect('/settings')
    }
  })
})
app.post('/monitor', function(req, res) {
  Monitoring.upsertMonitor(req.body, (err, upsertedMonitor) => {
    if(err) {
      logger.error(err)
      res.redirect(`/settings?err=${err.message}`)
    } else {
      res.redirect('/settings')
    }
  })
})
app.post('/monitor/delete/:id', function(req, res) {
  Monitoring.deleteMonitor(req.params.id, (err) => {
    if(err) {
      logger.error(err)
      res.redirect(`/settings?err=${err.message}`)
    } else {
      res.redirect('/settings')
    }
  })
})



module.exports = app