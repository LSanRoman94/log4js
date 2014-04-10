var Appender = require('./appender');
var NullLayout = require('../layouts/null-layout');
var Level = require('../level');

/* ---------------------------------------------------------------------- */
// BrowserConsoleAppender (only works in Opera and Safari and Firefox with
// Firebug extension)

function BrowserConsoleAppender(log4js) {
  this.log4js = log4js;
}

BrowserConsoleAppender.prototype = new Appender();

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

  var formattedMessage = getFormattedMessage();
  var objs = objects(loggingEvent.messages);
  objs.splice(0, 0, formattedMessage);

  // Specific to our use-case...
  try {
    var line = null;
    var error = new Error();
    var stack = error.stack;
    var i = stack.indexOf('Object.require.register.Logger.');
    if (i >= 0) {
      var j = stack.indexOf('\n', i);
      var h = stack.indexOf('(', j + 1);
      line = stack.substring(h, stack.indexOf(')', h) + 1);
    } else {
      var lines = stack.split('\n');
      if (lines.length >= 5) {
        line = lines[5];
      }
    }

    if (line) {
      var obj = objs[0];
      if (typeof(obj) === 'string') {
        objs[0] = obj.slice(0, -1) + ' - ' + line;
      } else {
        objs.push(line);
      }
    }
  } catch (err) { /* ignore */ }

  if ((typeof opera != "undefined") && opera.postError) { // Opera
    opera.postError(formattedMessage);
  } else if (window.console && window.console.log) { // Safari and Firebug

    // Log to Firebug using its logging methods or revert to the console.log
    // method in Safari
    if (window.console.debug && Level.DEBUG.isGreaterOrEqual(loggingEvent.level)) {
      window.console.debug.apply(window.console, objs);
    } else if (window.console.info && Level.INFO.equals(loggingEvent.level)) {
      window.console.info.apply(window.console, objs);
    } else if (window.console.warn && Level.WARN.equals(loggingEvent.level)) {
      window.console.warn.apply(window.console, objs);
    } else if (window.console.error && loggingEvent.level.isGreaterOrEqual(Level.ERROR)) {
      window.console.error.apply(window.console, objs);
    } else {
      window.console.log.apply(window.console, objs);
    }
  }
};

function objects(messages) {
  var objs = [];
  for (var i = 0; i < messages.length; i++) {
    if (typeof messages[i] === "object") {
      objs.push(messages[i]);
    }
  }
  return objs;
}

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

module.exports = exports = BrowserConsoleAppender;