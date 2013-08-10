
var logLog = require('./util/logLog');
var Level = require('./level');
var EventSupport = require('./event-support');
var Logger = require('./logger');


var utils = require('./util/util');
var handleError = utils.handleError;
var toStr = utils.toStr;

var pageLoaded = false;

// Create main log4javascript object; this will be assigned public properties
function Log4JavaScript() {
  this.rootLogger = new Logger(Logger.rootLoggerName, this);
  this.rootLogger.setLevel(ROOT_LOGGER_DEFAULT_LEVEL);

// Hashtable of loggers keyed by logger name
  this.loggers = {};
  this.loggerNames = [];

  this.applicationStartDate = new Date();
  this.enabled = true;
  this.showStackTraces = false;
  this.useTimeStampsInMilliseconds = true;
  this.uniqueId = "log4javascript_" + this.applicationStartDate.getTime() + "_" +
    Math.floor(Math.random() * 100000000);
}

Log4JavaScript.prototype = new EventSupport();

Log4JavaScript.prototype.version = "1.4.6";
Log4JavaScript.prototype.edition = "log4javascript";

// This evaluates the given expression in the current scope, thus allowing
// scripts to access private variables. Particularly useful for testing
Log4JavaScript.evalInScope = function(expr) {
  return eval(expr);
};

/* ---------------------------------------------------------------------- */
// Logger access methods


var ROOT_LOGGER_DEFAULT_LEVEL = Level.DEBUG;

Log4JavaScript.prototype.getRootLogger = function() {
  return this.rootLogger;
};

Log4JavaScript.prototype.getLogger = function(loggerName) {
  // Use default logger if loggerName is not specified or invalid
  if (!(typeof loggerName == "string")) {
    loggerName = Logger.anonymousLoggerName;
    logLog.warn("log4javascript.getLogger: non-string logger name "	+
      toStr(loggerName) + " supplied, returning anonymous logger");
  }

  // Do not allow retrieval of the root logger by name
  if (loggerName == Logger.rootLoggerName) {
    handleError("log4javascript.getLogger: root logger may not be obtained by name");
  }

  // Create the logger for this name if it doesn't already exist
  if (!this.loggers[loggerName]) {
    var logger = new Logger(loggerName, this);
    this.loggers[loggerName] = logger;
    this.loggerNames.push(loggerName);

    // Set up parent logger, if it doesn't exist
    var lastDotIndex = loggerName.lastIndexOf(".");
    var parentLogger;
    if (lastDotIndex > -1) {
      var parentLoggerName = loggerName.substring(0, lastDotIndex);
      parentLogger = this.getLogger(parentLoggerName); // Recursively sets up grandparents etc.
    } else {
      parentLogger = this.rootLogger;
    }
    parentLogger.addChild(logger);
  }
  return this.loggers[loggerName];
};

var defaultLogger = null;
Log4JavaScript.prototype.getDefaultLogger = function() {
  if (!defaultLogger) {
    defaultLogger = this.getLogger(Logger.defaultLoggerName);
    var a = new this.BrowserConsoleAppender(this);
    defaultLogger.addAppender(a);
  }
  return defaultLogger;
};

var nullLogger = null;
Log4JavaScript.prototype.getNullLogger = function() {
  if (!nullLogger) {
    nullLogger = new Logger(Logger.nullLoggerName, this);
    nullLogger.setLevel(Level.OFF);
  }
  return nullLogger;
};

// Destroys all loggers
Log4JavaScript.prototype.resetConfiguration = function() {
  this.rootLogger.setLevel(ROOT_LOGGER_DEFAULT_LEVEL);
  this.loggers = {};
};

/* ---------------------------------------------------------------------- */
// Main load
module.exports = exports = new Log4JavaScript();
exports.setEventTypes(["load", "error"]);

Log4JavaScript.prototype.setDocumentReady = function() {
  pageLoaded = true;
  exports.dispatchEvent("load", {});
};

if (window.addEventListener) {
  window.addEventListener("load", exports.setDocumentReady, false);
} else if (window.attachEvent) {
  window.attachEvent("onload", exports.setDocumentReady);
} else {
  var oldOnload = window.onload;
  if (typeof window.onload != "function") {
    window.onload = exports.setDocumentReady;
  } else {
    window.onload = function(evt) {
      if (oldOnload) {
        oldOnload(evt);
      }
      exports.setDocumentReady();
    };
  }
}
