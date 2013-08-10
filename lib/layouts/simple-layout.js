var Layout = require('./layout');

// SimpleLayout
function SimpleLayout(log4js) {
  this.log4js = log4js;
  this.customFields = [];
}

SimpleLayout.prototype = new Layout();

SimpleLayout.prototype.format = function(loggingEvent) {
  return loggingEvent.level.name + " - " + loggingEvent.getCombinedMessages();
};

SimpleLayout.prototype.ignoresThrowable = function() {
  return true;
};

SimpleLayout.prototype.toString = function() {
  return "SimpleLayout";
};

module.exports = exports = SimpleLayout;