const path = require('path')
const watch = require('node-watch')

if (process.env.NODE_ENV !== 'production') {
  var templatesDir = path.join(__dirname, '..', '..', 'views')
  var publicDir = path.join(__dirname, '..', '..', 'public')
  // Enable hot reloading in development
  require('marko/hot-reload').enable()

  let allMarkoFiles = walkSync(templatesDir).filter((filename) => {
    return /\.(marko|component\.js)$/.test(filename)
  })
  watch(templatesDir, { recursive: true }, function() {
    allMarkoFiles.forEach(filename => {
      require('marko/hot-reload').handleFileModified(filename)
      require('lasso').handleWatchedFileChanged(filename)
    })
  })
  watch(publicDir, { recursive: true }, function() {
    allMarkoFiles.forEach(filename => {
      require('marko/hot-reload').handleFileModified(filename)
      require('lasso').handleWatchedFileChanged(filename)
    })
  })
}

function walkSync(dir, filelist) {
  var fs = fs || require('fs')
  var files = fs.readdirSync(dir)
  filelist = filelist || []
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir,file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist)
    } else {
      filelist.push(path.join(dir, file))
    }
  })
  return filelist
}