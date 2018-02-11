
var app = require('express').Router()
var logger = require('logacious')()

var template = require('../../views/index/index.marko')

app.get('/', function(req, res) {
  res.marko(template, {page: 'home'})
})


module.exports = app