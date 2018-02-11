
var moment = require('moment')

module.exports = Component;
function Component() {}

Component.prototype.onInput = function(input) {
  if(input.value) {
    input.formattedValue = moment(input.value).format(input.format || 'YYYY-MM-DD HH:mm')
  }
}