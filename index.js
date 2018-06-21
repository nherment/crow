"use strict";

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const MINUTE = 60 * 1000

const cookieParser = require('cookie-parser')
const compression = require('compression')
const bodyParser = require('body-parser')
const logger = require('logacious')()
const express = require('express')
const path = require('path')
const http = require('http')
const _ = require('lodash')
const url = require('url')
const cluster = require('./lib/cluster.js')
const RateLimit = require('express-rate-limit')
const os = require('os')
const conf = require('./lib/conf.js')

const migrations = require('./lib/migrations.js')
const monitoringWorker = require('./lib/monitor/MonitoringWorker.js')

function startWebServer(callback) {

  require('marko/node-require').install({
    compilerOptions: {
      writeToDisk: false
    }
  })

  require('./lib/web/markoHelpers.js')
  require('marko/browser-refresh').enable();
  require('marko/hot-reload').enable();
  require('marko/express')

  const appPublic = require('./lib/web/appPublic.js')
  const appPrivate = require('./lib/web/appPrivate.js')

  const utils = require('./lib/web/middlewareUtils.js')
  const auth = require('./lib/web/middlewareAuth.js')

  require('lasso').configure({
    plugins: [
      'lasso-marko',
      'lasso-sass'
    ],
    bundleReadTimeout: 30000,
    outputDir: __dirname + '/static',
    bundlingEnabled: IS_PRODUCTION,
    minify: false,
    fingerprintsEnabled: IS_PRODUCTION
  })
  
  var limiter = new RateLimit({
    windowMs: 60*5000, // 5 minutes
    max: 900, // limit each IP to N requests per windowMs
    delayMs: 0 // disable delaying
  })
  
  var app = express()
  app.enable('trust proxy', 'loopback')
  app.disable('x-powered-by')

  if(process.env.FORCE_TLS) {
    app.use(express_enforces_ssl());
    app.use(hsts({
      maxAge: 31536000, // 1 year
      includeSubDomains: true, // Must be enabled for preload to be approved
      preload: true
    }))
  }
   
  if(conf.isProduction) {
    app.use(limiter)
  }
  
  app.use(compression())
  app.use(function(req, res, next) {
    res.locals.query = req.query
    next()
  })

  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(cookieParser())
  
  app.use((req, res, next) => {
    res.locals.ENV = app.locals.ENV
    next()
  })
  app.use((req, res, next) => {
    let marko = res.marko
    res.marko = (template, data) => {
      if(!data) {
        data = {}
      }
      _.defaults(data, res.locals)
      marko.call(res, template, data)
    }
    next()
  })


  app.use(utils.errorResponse)
  auth.setupSessions(app)
  auth.pullUserFromSession(app)
  app.use(appPublic)
          
  app.use(express.static(path.join(__dirname, 'public'), {
    etag: false
  }))
  app.use(require('lasso/middleware').serveStatic());
  
  app.use(appPrivate)
  


  let port = process.env.PORT || 3000

  let server = http.createServer(app)
  let listenInterface = '::';
  
  server.listen(port, listenInterface, function () {
    logger.info('Server started on port', port)
    if(callback) {
      callback(server)
    }
  })
}

function migrate(callback) {
  migrations(err => {
    if(err) {
      logger.error(err)
      process.exit(1)
    }
    callback()
  })
}

if(require.main === module) {
  let c = new cluster()
  c.initialize(migrate)
  var webServerWorkerCount = 1;
  if(IS_PRODUCTION) {
    webServerWorkerCount = Math.min(webServerWorkerCount, os.cpus().length - 1)
  }
  c.worker(startWebServer, webServerWorkerCount)
  c.worker(monitoringWorker, 1)
  c.start()
} else {
  module.exports = (callback) => {
    migrate((err) => {
      if(err) return callback(err)
      startWebServer(callback)
    })
  }
}