
var NullLayout = require('../null-layout');

/* ---------------------------------------------------------------------- */
// BrowserConsoleAppender (only works in Opera and Safari and Firefox with
// Firebug extension)

function BrowserConsoleAppender() {}

BrowserConsoleAppender.prototype = new log4javascript.Appender();
BrowserConsoleAppender.prototype.layout = new NullLayout();
BrowserConsoleAppender.prototype.threshold = Level.DEBUG;

BrowserConsoleAppender.prototype.append = function(loggingEvent) {
  var appender = this;

  var getFormattedMessage = function() {
    var layout = appender.getLayout();
    var formattedMessage = layout.format(loggingEvent);
    if (layout.ignoresThrowable() && loggingEvent.exception) {
      formattedMessage += loggingEvent.getThrowableStrRep();
    }
    return formattedMessage;
  };

  if ((typeof opera != "undefined") && opera.postError) { // Opera
    console.log(['opera']);
    opera.postError(getFormattedMessage());
  } else if (window.console && window.console.log) { // Safari and Firebug
    var formattedMesage = getFormattedMessage();
    // Log to Firebug using its logging methods or revert to the console.log
    // method in Safari
    if (window.console.debug && Level.DEBUG.isGreaterOrEqual(loggingEvent.level)) {
      window.console.debug(formattedMesage);
    } else if (window.console.info && Level.INFO.equals(loggingEvent.level)) {
      window.console.info(formattedMesage);
    } else if (window.console.warn && Level.WARN.equals(loggingEvent.level)) {
      window.console.warn(formattedMesage);
    } else if (window.console.error && loggingEvent.level.isGreaterOrEqual(Level.ERROR)) {
      window.console.error(formattedMesage);
    } else {
      window.console.log(formattedMesage);
    }
  }
};

BrowserConsoleAppender.prototype.group = function(name) {
  if (window.console && window.console.group) {
    window.console.group(name);
  }
};

BrowserConsoleAppender.prototype.groupEnd = function() {
  if (window.console && window.console.groupEnd) {
    window.console.groupEnd();
  }
};

BrowserConsoleAppender.prototype.toString = function() {
  return "BrowserConsoleAppender";
};

log4javascript.BrowserConsoleAppender = BrowserConsoleAppender;

module.exports = exports = BrowserConsoleAppender;