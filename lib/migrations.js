
var Postgrator = require('postgrator')
var logger = require('logacious')()
var path = require('path')

let migrationsFolder = path.join(__dirname, '..', 'db', 'schema')

module.exports = (callback) => {

  postgrator = new Postgrator({
    migrationDirectory: migrationsFolder,
    schemaTable: 'crow_schema_version',
    driver: 'pg',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'crow',
    username: process.env.DB_USER || 'crow',
    password: process.env.DB_PWD || 'crow'
  })
  postgrator.migrate('001')
    .then(() => {
      logger.info('Migration successful')
      callback()
    })
    .catch((err) => {
      logger.error('Migration failed', err)
      callback(err)
    })
    
  postgrator.on('migration-started', migration => logger.info('Starting migration', migration))
  postgrator.on('migration-finished', migration => logger.info('Finished migration', migration))


}
