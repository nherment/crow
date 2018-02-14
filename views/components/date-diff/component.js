
var moment = require('moment')

module.exports = Component;
function Component() {}

Component.prototype.onCreate = function() {
  this.state = {
    formattedValue: '-'
  }
}
Component.prototype.onInput = function(input) {
  this.input = input
  this.refreshValue()
}
Component.prototype.onMount = function() {
  if(this.input && !this.input.to) {
    var that = this
    setInterval(function() {
      that.refreshValue()
    }, 60000)
  }
}
Component.prototype.refreshValue = function() {
  var formattedValue = ''
  if(this.input && this.input.from) {
    var diff = moment(this.input.to || moment()).diff(this.input.from)
    var duration = moment.duration(diff, 'milliseconds')

    if(duration.years() >= 1) {
      formattedValue += duration.years() + 'y '
      if(duration.months() >= 1) {
        formattedValue += duration.months() + 'month'
      } else if(duration.days() > 15) {
        formattedValue += '1m'
      }
    } else if(duration.months() >= 1) {
      formattedValue += duration.months() + 'month '
      if(duration.days() > 0) {
        formattedValue += duration.days() + 'd'
      }
    } else if(duration.asDays() > 2) {
      formattedValue += duration.days() + 'd '
      if(duration.hours() >= 1) {
        formattedValue += duration.hours() + 'hrs'
      }
    } else {
      if(duration.asHours() > 1) {
        formattedValue += Math.round(duration.asHours()) + 'h '
      }
      if(duration.minutes() >= 1) {
        formattedValue += duration.minutes() + 'min'
      }
      if(!formattedValue) {
        formattedValue += duration.asSeconds() + 's'
      }
    }
  }
  this.state = {
    formattedValue: formattedValue
  }
}

