
require('colors')

var ResultPrinter = {}

ResultPrinter.stringifyLastResults = function(options, remotes) {

  var Table = require('cli-table');

// instantiate
  var tableOptions = {
    head: ['URI', 'Method', 'Status', 'Delay']
  }

  if(options.showIPv4) {
    tableOptions.head.push('IP v4 Address')
  }

  if(options.showIPv6) {
    tableOptions.head.push('IP v6 Address')
  }

  var table = new Table(tableOptions);

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
        resultText = resultText.bold.red

      } else if(!result.success) {

        resultText = 'Error: HTTP '+result.response.statusCode
        resultText = resultText.bold.red
      }

      var delayText = result.delay + 'ms'
      if(result.delay > 1000) {
        delayText = delayText.bold.red
      }

      var tableData = [
        remotes[i].fullUrl(),
        remotes[i].method(),
        resultText,
        delayText
      ]

      if(options.showIPv4) {
        tableData.push(result.ipv4Addresses)
      }

      if(options.showIPv6) {
        tableData.push(result.ipv6Addresses)
      }

      table.push(tableData)

    }
  }

  return table.toString();


}

module.exports = ResultPrinter