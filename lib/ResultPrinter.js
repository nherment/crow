

var ResultPrinter = {}

ResultPrinter.stringifyLastResults = function(remotes) {

  var Table = require('cli-table');

// instantiate
  var table = new Table({
    head: ['URI', 'Method', 'Status', 'Delay']
  });


  remotes.sort(function(a, b) {

    var aa = a.domain() + a.port() + a.path() + a.protocol()
    var bb = b.domain() + b.port() + b.path() + b.protocol()

    if (aa > bb) {
      return 1
    } else if (aa < bb) {
      return -1
    } else {
      return 0
    }

  })

  for(var i = 0 ; i < remotes.length ; i++) {
    var result = remotes[i].lastResult()

    if(result) {


      var resultText = 'ok'
      if(!result.success && result.response.error) {
        resultText = result.response.error.message
      } else if(!result.success) {
        resultText = 'Error: HTTP '+result.response.statusCode

      }
      table.push([remotes[i].fullUrl(), remotes[i].method(), resultText, result.delay + 'ms'])
    }
  }

  return table.toString();


}

module.exports = ResultPrinter