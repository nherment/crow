
var app = require('express').Router()
var logger = require('logacious')()

var template = require('../../views/index/index.marko')
var Monitoring = require('../monitor/Monitoring.js')

app.get('/', function(req, res) {
  Monitoring.fetchDashboardInformation((err, data) => {
    res.marko(template, Object.assign({err, page: 'home'}, data))
  })
})


module.exports = app