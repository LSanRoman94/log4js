/**
 * Copyright 2013 Tim Down.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * log4javascript
 *
 * log4javascript is a logging framework for JavaScript based on log4j
 * for Java. This file contains all core log4javascript code and is the only
 * file required to use log4javascript, unless you require support for
 * document.domain, in which case you will also need console.html, which must be
 * stored in the same directory as the main log4javascript.js file.
 *
 * Author: Tim Down <tim@log4javascript.org>
 * Version: 1.4.6
 * Edition: log4javascript
 * Build date: 19 March 2013
 * Website: http://log4javascript.org
 */

/* -------------------------------------------------------------------------- */

var log4javascript = (function() {

  var Layout = require('./layouts/layout');
  var log4js = require('./log4js');
  var logLog = require('./util/logLog');
  var Level = require('./level');
  var Appender = require('./appenders/appender');
  var EventSupport = require('./event-support');
  var SimpleDataFormat = require('./formats/simple-date-format');
  var SimpleLayout = require('./layouts/simple-layout');
  var LoggingEvent = require('./logging-event');
  var XmlLayout = require('./layouts/xml-layout');


  var utils = require('./util/util');
  var isUndefined = utils.isUndefined;
  var handleError = utils.handleError;
  var extractStringFromParam = utils.extractStringFromParam;
  var toStr = utils.toStr;
  var array_remove = utils.array_remove;
  var array_contains = utils.array_contains;
	var emptyFunction = utils.emptyFunction;
	var newLine = utils.newLine;
  var extractBooleanFromParam = utils.extractBooleanFromParam;
  var getExceptionStringRep = utils.getExceptionStringRep;
  var urlEncode = utils.urlEncode;
  var bool = utils.bool;

	/* -------------------------------------------------------------------------- */

	var pageLoaded = false;

	// Create main log4javascript object; this will be assigned public properties
	function Log4JavaScript() {}
	Log4JavaScript.prototype = new EventSupport();

	log4javascript = new Log4JavaScript();
	log4javascript.version = "1.4.6";
	log4javascript.edition = "log4javascript";

	/* -------------------------------------------------------------------------- */
	// Utility functions

	function trim(str) {
		return str.replace(/^\s+/, "").replace(/\s+$/, "");
	}

	var urlDecode = (typeof window.decodeURIComponent != "undefined") ?
		function(str) {
			return decodeURIComponent(str);
		}: 
		function(str) {
			return unescape(str).replace(/%2B/g, "+").replace(/%22/g, "\"").replace(/%27/g, "'").replace(/%2F/g, "/").replace(/%3D/g, "=");
		};

	function getListenersPropertyName(eventName) {
		return "__log4javascript_listeners__" + eventName;
	}


	function getEvent(evt, win) {
		win = win ? win : window;
		return evt ? evt : win.event;
	}


	log4javascript.setEventTypes(["load", "error"]);


	// This evaluates the given expression in the current scope, thus allowing
	// scripts to access private variables. Particularly useful for testing
	log4javascript.evalInScope = function(expr) {
		return eval(expr);
	};



	/* ---------------------------------------------------------------------- */
	// Timers

	function Timer(name, level) {
		this.name = name;
		this.level = isUndefined(level) ? Level.INFO : level;
		this.start = new Date();
	}

	Timer.prototype.getElapsedTime = function() {
		return new Date().getTime() - this.start.getTime();
	};

	/* ---------------------------------------------------------------------- */
	// Loggers

	var anonymousLoggerName = "[anonymous]";
	var defaultLoggerName = "[default]";
	var nullLoggerName = "[null]";
	var rootLoggerName = "root";

	function Logger(name) {
		this.name = name;
		this.parent = null;
		this.children = [];

		var appenders = [];
		var loggerLevel = null;
		var isRoot = (this.name === rootLoggerName);
		var isNull = (this.name === nullLoggerName);

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
				handleError("Logger.addAppender: you may not add an appender to the null logger");
			} else {
				if (appender instanceof Appender) {
					if (!array_contains(appenders, appender)) {
						appenders.push(appender);
						appender.setAddedToLogger(this);
						this.invalidateAppenderCache();
					}
				} else {
					handleError("Logger.addAppender: appender supplied ('" +
						toStr(appender) + "') is not a subclass of Appender");
				}
			}
		};

		this.removeAppender = function(appender) {
			array_remove(appenders, appender);
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
			if (log4js.enabled && level.isGreaterOrEqual(this.getEffectiveLevel())) {
				// Check whether last param is an exception
				var exception;
				var finalParamIndex = params.length - 1;
				var lastParam = params[finalParamIndex];
				if (params.length > 1 && isError(lastParam)) {
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
				handleError("Logger.setLevel: you cannot set the level of the root logger to null");
			} else if (level instanceof Level) {
				loggerLevel = level;
			} else {
				handleError("Logger.setLevel: level supplied to logger " +
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
		};

		this.group = function(name, initiallyExpanded) {
			if (log4js.enabled) {
				var effectiveAppenders = this.getEffectiveAppenders();
				for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
					effectiveAppenders[i].group(name, initiallyExpanded);
				}
			}
		};

		this.groupEnd = function() {
			if (log4js.enabled) {
				var effectiveAppenders = this.getEffectiveAppenders();
				for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
					effectiveAppenders[i].groupEnd();
				}
			}
		};

		var timers = {};

		this.time = function(name, level) {
			if (log4js.enabled) {
				if (isUndefined(name)) {
					handleError("Logger.time: a name for the timer must be supplied");
				} else if (level && !(level instanceof Level)) {
					handleError("Logger.time: level supplied to timer " +
						name + " is not an instance of log4javascript.Level");
				} else {
					timers[name] = new Timer(name, level);
				}
			}
		};

		this.timeEnd = function(name) {
			if (log4js.enabled) {
				if (isUndefined(name)) {
					handleError("Logger.timeEnd: a name for the timer must be supplied");
				} else if (timers[name]) {
					var timer = timers[name];
					var milliseconds = timer.getElapsedTime();
					this.log(timer.level, ["Timer " + toStr(name) + " completed in " + milliseconds + "ms"]);
					delete timers[name];
				} else {
					logLog.warn("Logger.timeEnd: no timer found with name " + name);
				}
			}
		};

		this.assert = function(expr) {
			if (log4js.enabled && !expr) {
				var args = [];
				for (var i = 1, len = arguments.length; i < len; i++) {
					args.push(arguments[i]);
				}
				args = (args.length > 0) ? args : ["Assertion Failure"];
				args.push(newLine);
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

	/* ---------------------------------------------------------------------- */
	// Logger access methods

	// Hashtable of loggers keyed by logger name
	var loggers = {};
	var loggerNames = [];

	var ROOT_LOGGER_DEFAULT_LEVEL = Level.DEBUG;
	var rootLogger = new Logger(rootLoggerName);
	rootLogger.setLevel(ROOT_LOGGER_DEFAULT_LEVEL);

	log4javascript.getRootLogger = function() {
		return rootLogger;
	};

	log4javascript.getLogger = function(loggerName) {
		// Use default logger if loggerName is not specified or invalid
		if (!(typeof loggerName == "string")) {
			loggerName = anonymousLoggerName;
			logLog.warn("log4javascript.getLogger: non-string logger name "	+
				toStr(loggerName) + " supplied, returning anonymous logger");
		}

		// Do not allow retrieval of the root logger by name
		if (loggerName == rootLoggerName) {
			handleError("log4javascript.getLogger: root logger may not be obtained by name");
		}

		// Create the logger for this name if it doesn't already exist
		if (!loggers[loggerName]) {
			var logger = new Logger(loggerName);
			loggers[loggerName] = logger;
			loggerNames.push(loggerName);

			// Set up parent logger, if it doesn't exist
			var lastDotIndex = loggerName.lastIndexOf(".");
			var parentLogger;
			if (lastDotIndex > -1) {
				var parentLoggerName = loggerName.substring(0, lastDotIndex);
				parentLogger = log4javascript.getLogger(parentLoggerName); // Recursively sets up grandparents etc.
			} else {
				parentLogger = rootLogger;
			}
			parentLogger.addChild(logger);
		}
		return loggers[loggerName];
	};

	var defaultLogger = null;
	log4javascript.getDefaultLogger = function() {
		if (!defaultLogger) {
			defaultLogger = log4javascript.getLogger(defaultLoggerName);
			var a = new log4javascript.PopUpAppender();
			defaultLogger.addAppender(a);
		}
		return defaultLogger;
	};

	var nullLogger = null;
	log4javascript.getNullLogger = function() {
		if (!nullLogger) {
			nullLogger = new Logger(nullLoggerName);
			nullLogger.setLevel(Level.OFF);
		}
		return nullLogger;
	};

	// Destroys all loggers
	log4javascript.resetConfiguration = function() {
		rootLogger.setLevel(ROOT_LOGGER_DEFAULT_LEVEL);
		loggers = {};
	};

	/* ---------------------------------------------------------------------- */
	// Main load

   log4javascript.setDocumentReady = function() {
       pageLoaded = true;
       log4javascript.dispatchEvent("load", {});
   };

    if (window.addEventListener) {
        window.addEventListener("load", log4javascript.setDocumentReady, false);
    } else if (window.attachEvent) {
        window.attachEvent("onload", log4javascript.setDocumentReady);
    } else {
        var oldOnload = window.onload;
        if (typeof window.onload != "function") {
            window.onload = log4javascript.setDocumentReady;
        } else {
            window.onload = function(evt) {
                if (oldOnload) {
                    oldOnload(evt);
                }
                log4javascript.setDocumentReady();
            };
        }
    }

    return log4javascript;
})();

module.exports = exports = log4javascript;