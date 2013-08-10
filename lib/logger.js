
/* ---------------------------------------------------------------------- */
// Loggers
var utils = require('./util/util');
var LoggingEvent = require('./logging-event');
var Appender = require('./appenders/appender');
var Timer = require('./util/timer');
var Level = require('./level');
var logLog = require('./util/logLog');

Logger.anonymousLoggerName = "[anonymous]";
Logger.defaultLoggerName = "[default]";
Logger.nullLoggerName = "[null]";
Logger.rootLoggerName = "root";

function Logger(name, log4js) {
  this.name = name;
  this.parent = null;
  this.children = [];
  this.log4js = log4js;

  var appenders = [];
  var loggerLevel = null;
  var isRoot = (this.name === Logger.rootLoggerName);
  var isNull = (this.name === Logger.nullLoggerName);

  var appenderCache = null;
  var appenderCacheInvalidated = false;

  this.addChild = function(childLogger) {
    this.children.push(childLogger);
    childLogger.parent = this;
    childLogger.invalidateAppenderCache();
  };

  // Additivity
  var additive = true;
  this.getAdditivity = function() {
    return additive;
  };

  this.setAdditivity = function(additivity) {
    var valueChanged = (additive != additivity);
    additive = additivity;
    if (valueChanged) {
      this.invalidateAppenderCache();
    }
  };

  // Create methods that use the appenders variable in this scope
  this.addAppender = function(appender) {
    if (isNull) {
      utils.handleError("Logger.addAppender: you may not add an appender to the null logger");
    } else {
      if (appender instanceof Appender) {
        if (!utils.array_contains(appenders, appender)) {
          appenders.push(appender);
          appender.setAddedToLogger(this);
          this.invalidateAppenderCache();
        }
      } else {
        utils.handleError("Logger.addAppender: appender supplied ('" +
          utils.toStr(appender) + "') is not a subclass of Appender");
      }
    }
  };

  this.removeAppender = function(appender) {
    utils.array_remove(appenders, appender);
    appender.setRemovedFromLogger(this);
    this.invalidateAppenderCache();
  };

  this.removeAllAppenders = function() {
    var appenderCount = appenders.length;
    if (appenderCount > 0) {
      for (var i = 0; i < appenderCount; i++) {
        appenders[i].setRemovedFromLogger(this);
      }
      appenders.length = 0;
      this.invalidateAppenderCache();
    }
  };

  this.getEffectiveAppenders = function() {
    if (appenderCache === null || appenderCacheInvalidated) {
      // Build appender cache
      var parentEffectiveAppenders = (isRoot || !this.getAdditivity()) ?
        [] : this.parent.getEffectiveAppenders();
      appenderCache = parentEffectiveAppenders.concat(appenders);
      appenderCacheInvalidated = false;
    }
    return appenderCache;
  };

  this.invalidateAppenderCache = function() {
    appenderCacheInvalidated = true;
    for (var i = 0, len = this.children.length; i < len; i++) {
      this.children[i].invalidateAppenderCache();
    }
  };

  this.log = function(level, params) {
    if (this.log4js.enabled && level.isGreaterOrEqual(this.getEffectiveLevel())) {
      // Check whether last param is an exception
      var exception;
      var finalParamIndex = params.length - 1;
      var lastParam = params[finalParamIndex];
      if (params.length > 1 && utils.isError(lastParam)) {
        exception = lastParam;
        finalParamIndex--;
      }

      // Construct genuine array for the params
      var messages = [];
      for (var i = 0; i <= finalParamIndex; i++) {
        messages[i] = params[i];
      }

      var loggingEvent = new LoggingEvent(
        this, new Date(), level, messages, exception);

      this.callAppenders(loggingEvent);
    }
  };

  this.callAppenders = function(loggingEvent) {
    var effectiveAppenders = this.getEffectiveAppenders();
    for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
      effectiveAppenders[i].doAppend(loggingEvent);
    }
  };

  this.setLevel = function(level) {
    // Having a level of null on the root logger would be very bad.
    if (isRoot && level === null) {
      utils.handleError("Logger.setLevel: you cannot set the level of the root logger to null");
    } else if (level instanceof Level) {
      loggerLevel = level;
    } else {
      utils.handleError("Logger.setLevel: level supplied to logger " +
        this.name + " is not an instance of log4javascript.Level");
    }
  };

  this.getLevel = function() {
    return loggerLevel;
  };

  this.getEffectiveLevel = function() {
    for (var logger = this; logger !== null; logger = logger.parent) {
      var level = logger.getLevel();
      if (level !== null) {
        return level;
      }
    }
    return null;
  };

  this.group = function(name, initiallyExpanded) {
    if (this.log4js.enabled) {
      var effectiveAppenders = this.getEffectiveAppenders();
      for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
        effectiveAppenders[i].group(name, initiallyExpanded);
      }
    }
  };

  this.groupEnd = function() {
    if (this.log4js.enabled) {
      var effectiveAppenders = this.getEffectiveAppenders();
      for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
        effectiveAppenders[i].groupEnd();
      }
    }
  };

  var timers = {};

  this.time = function(name, level) {
    if (this.log4js.enabled) {
      if (utils.isUndefined(name)) {
        utils.handleError("Logger.time: a name for the timer must be supplied");
      } else if (level && !(level instanceof Level)) {
        utils.handleError("Logger.time: level supplied to timer " +
          name + " is not an instance of log4javascript.Level");
      } else {
        timers[name] = new Timer(name, level);
      }
    }
  };

  this.timeEnd = function(name) {
    if (this.log4js.enabled) {
      if (utils.isUndefined(name)) {
        utils.handleError("Logger.timeEnd: a name for the timer must be supplied");
      } else if (timers[name]) {
        var timer = timers[name];
        var milliseconds = timer.getElapsedTime();
        this.log(timer.level, ["Timer " + utils.toStr(name) + " completed in " + milliseconds + "ms"]);
        delete timers[name];
      } else {
        logLog.warn("Logger.timeEnd: no timer found with name " + name);
      }
    }
  };

  this.assert = function(expr) {
    if (this.log4js.enabled && !expr) {
      var args = [];
      for (var i = 1, len = arguments.length; i < len; i++) {
        args.push(arguments[i]);
      }
      args = (args.length > 0) ? args : ["Assertion Failure"];
      args.push(utils.newLine);
      args.push(expr);
      this.log(Level.ERROR, args);
    }
  };

  this.toString = function() {
    return "Logger[" + this.name + "]";
  };
}

Logger.prototype = {
  trace: function() {
    this.log(Level.TRACE, arguments);
  },

  debug: function() {
    this.log(Level.DEBUG, arguments);
  },

  info: function() {
    this.log(Level.INFO, arguments);
  },

  warn: function() {
    this.log(Level.WARN, arguments);
  },

  error: function() {
    this.log(Level.ERROR, arguments);
  },

  fatal: function() {
    this.log(Level.FATAL, arguments);
  },

  isEnabledFor: function(level) {
    return level.isGreaterOrEqual(this.getEffectiveLevel());
  },

  isTraceEnabled: function() {
    return this.isEnabledFor(Level.TRACE);
  },

  isDebugEnabled: function() {
    return this.isEnabledFor(Level.DEBUG);
  },

  isInfoEnabled: function() {
    return this.isEnabledFor(Level.INFO);
  },

  isWarnEnabled: function() {
    return this.isEnabledFor(Level.WARN);
  },

  isErrorEnabled: function() {
    return this.isEnabledFor(Level.ERROR);
  },

  isFatalEnabled: function() {
    return this.isEnabledFor(Level.FATAL);
  }
};

Logger.prototype.trace.isEntryPoint = true;
Logger.prototype.debug.isEntryPoint = true;
Logger.prototype.info.isEntryPoint = true;
Logger.prototype.warn.isEntryPoint = true;
Logger.prototype.error.isEntryPoint = true;
Logger.prototype.fatal.isEntryPoint = true;

module.exports = exports = Logger;