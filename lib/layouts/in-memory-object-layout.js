
/* ---------------------------------------------------------------------- */
// InMemoryObjectLayout related
var Layout = require('./layout');
var utils = require('../util/util');
var newLine = utils.newLine;

function escapeNewLines(str) {
  return str.replace(/\r\n|\r|\n/g, "\\r\\n");
}

function InMemoryObjectLayout(log4js, readable, combineMessages) {
  this.log4js = log4js;
  this.customFields = [];
  this.setKeys();
}

InMemoryObjectLayout.prototype = new Layout();

InMemoryObjectLayout.prototype.format = function(loggingEvent) {
  var dataValues = this.getDataValues(loggingEvent, this.combineMessages);

  var message = {};
  for (var i = 0; i < dataValues.length; i++) {
    var key = dataValues[i][0];
    if (key === 'message') {
      var value = dataValues[i][1];
      if (value.length === 1) {
        message[key] = value[0];
      } else {
        message[key] = value;
      }
    } else {
      message[key] = dataValues[i][1];
    }
  }
  if (loggingEvent.exception) {
    message.exception = loggingEvent.exception;
  }
  message.timestamp = loggingEvent.timestamp;

  return message;
};

InMemoryObjectLayout.prototype.ignoresThrowable = function() {
  return true;
};

InMemoryObjectLayout.prototype.toString = function() {
  return "InMemoryObjectLayout";
};

InMemoryObjectLayout.prototype.getContentType = function() {
  return "application/json";
};

module.exports = exports = InMemoryObjectLayout;