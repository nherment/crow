
module.exports = Component;
function Component() {}

Component.prototype.onInput = function(input) {
  if(!this.setState) {
    this.setState = function(key, value) {
      if(!this.state) {
        this.state = {}
      }
      this.state[key] = value
    }
  }

  this.setState('barsBottom', 150)
  this.setState('chartHeight', 150)
  this.setState('barSpacing', 5)
  this.setState('barWidth', 2)
  
  if(input.monitor && input.monitor.statusChecks) {
    this.input = input.monitor
    this.drawSvg()
  }
}

Component.prototype.onMount = function() {
  this.drawSvg()
}
Component.prototype.drawSvg = function() {

  let maxResponseTime = this.input.statusChecks
    .map(r => r.responseTime)
    .reduce((a,b) => Math.max(a,b))

  this.input.statusChecks.forEach((statusCheck) => {
    if(statusCheck.responseTime) {
      statusCheck.height = this.state.barsBottom * (statusCheck.responseTime / maxResponseTime)
    }
  })
  this.setState('statusChecks', this.input.statusChecks)
}