var Appender = require('./appender');
var NullLayout = require('../layouts/null-layout');
var Level = require('../level');

/* ---------------------------------------------------------------------- */
// BrowserConsoleAppender (only works in Opera and Safari and Firefox with
// Firebug extension)



var con;
try {
  con = window.console;
} catch (err) {
  con = console;
}

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
    var i = stack.indexOf('.Logger.');
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
  } else { // Safari and Firebug

    // Log to Firebug using its logging methods or revert to the console.log
    // method in Safari
    if (con.debug && Level.DEBUG.isGreaterOrEqual(loggingEvent.level)) {
      if (con.debug.apply === undefined) {
        Function.prototype.call.apply(con.debug, objs);
      } else {
        con.debug.apply(con, objs);
      }
    } else if (con.info && Level.INFO.equals(loggingEvent.level)) {
      if (con.info.apply === undefined) {
        Function.prototype.call.apply(con.info, objs);
      } else {
        con.info.apply(con, objs);
      }
    } else if (con.warn && Level.WARN.equals(loggingEvent.level)) {
      if (con.warn.apply === undefined) {
        Function.prototype.call.apply(con.warn, objs);
      } else {
        con.warn.apply(con, objs);
      }

    } else if (con.error && loggingEvent.level.isGreaterOrEqual(Level.ERROR)) {
      if (con.error.apply === undefined) {
        Function.prototype.call.apply(con.error, objs);
      } else {
        con.error.apply(con, objs);
      }

    } else {
      if (con.log.apply === undefined) {
        Function.prototype.call.apply(con.log, objs);
      } else {
        con.log.apply(con, objs);
      }
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
  if (con && con.group) {
    con.group(name);
  }
};

BrowserConsoleAppender.prototype.groupEnd = function() {
  if (con && con.groupEnd) {
    con.groupEnd();
  }
};

BrowserConsoleAppender.prototype.toString = function() {
  return "BrowserConsoleAppender";
};

module.exports = exports = BrowserConsoleAppender;