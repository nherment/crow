
var moment = require('moment')

module.exports = Component;
function Component() {}

Component.prototype.onInput = function(input) {
  this.state = input
}
Component.prototype.openSignInForm = function() {
  this.setState('showSignInForm', true)
}
Component.prototype.cancelSignIn = function(event) {
  event.preventDefault()
  event.stopPropagation()
  this.setState('showSignInForm', false)
}