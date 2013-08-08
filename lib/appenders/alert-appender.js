
/* ---------------------------------------------------------------------- */
// AlertAppender

var Appender = require('./appender');
var SimpleLayout = require('../layouts/simple-layout');

function AlertAppender() {}

AlertAppender.prototype = new Appender();

AlertAppender.prototype.layout = new SimpleLayout();

AlertAppender.prototype.append = function(loggingEvent) {
  var formattedMessage = this.getLayout().format(loggingEvent);
  if (this.getLayout().ignoresThrowable()) {
    formattedMessage += loggingEvent.getThrowableStrRep();
  }
  alert(formattedMessage);
};

AlertAppender.prototype.toString = function() {
  return "AlertAppender";
};

module.exports = exports = AlertAppender;

