/* ---------------------------------------------------------------------- */
// Simple logging for log4javascript itself

var utils = require('./util');
var newLine = utils.newLine;
var getExceptionStringRep = utils.getExceptionStringRep;


var logLog = {
  quietMode: false,

  debugMessages: [],

  setQuietMode: function(quietMode) {
    this.quietMode = Boolean(quietMode);
  },

  numberOfErrors: 0,

  alertAllErrors: false,

  setAlertAllErrors: function(alertAllErrors) {
    this.alertAllErrors = alertAllErrors;
  },

  debug: function(message) {
    this.debugMessages.push(message);
  },

  displayDebug: function() {
    alert(this.debugMessages.join(newLine));
  },

  warn: function(message, exception) {
  },

  error: function(message, exception) {
    if (++this.numberOfErrors == 1 || this.alertAllErrors) {
      if (!this.quietMode) {
        var alertMessage = "log4javascript error: " + message;
        if (exception) {
          alertMessage += newLine + newLine + "Original error: " + getExceptionStringRep(exception);
        }
        alert(alertMessage);
      }
    }
  }
};

module.exports = exports = logLog;