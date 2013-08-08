var EventSupport = require('../event-support');
var Layout = require('../layouts/layout');
var Level = require('../level');
var log4js = require('../log4js');
var utils = require('../util/util');
var PatternLayout = require('../layouts/pattern-layout');

/* ---------------------------------------------------------------------- */
// Appender prototype

var Appender = function() {};

Appender.prototype = new EventSupport();

Appender.prototype.layout = new PatternLayout();
Appender.prototype.threshold = Level.ALL;
Appender.prototype.loggers = [];

// Performs threshold checks before delegating actual logging to the
// subclass's specific append method.
Appender.prototype.doAppend = function(loggingEvent) {
  if (log4js.enabled && loggingEvent.level.level >= this.threshold.level) {
    this.append(loggingEvent);
  }
};

Appender.prototype.append = function(loggingEvent) {};

Appender.prototype.setLayout = function(layout) {
  if (layout instanceof Layout) {
    this.layout = layout;
  } else {
    utils.handleError("Appender.setLayout: layout supplied to " +
      this.toString() + " is not a subclass of Layout");
  }
};

Appender.prototype.getLayout = function() {
  return this.layout;
};

Appender.prototype.setThreshold = function(threshold) {
  if (threshold instanceof Level) {
    this.threshold = threshold;
  } else {
    utils.handleError("Appender.setThreshold: threshold supplied to " +
      this.toString() + " is not a subclass of Level");
  }
};

Appender.prototype.getThreshold = function() {
  return this.threshold;
};

Appender.prototype.setAddedToLogger = function(logger) {
  this.loggers.push(logger);
};

Appender.prototype.setRemovedFromLogger = function(logger) {
  utils.array_remove(this.loggers, logger);
};

Appender.prototype.group = utils.emptyFunction;
Appender.prototype.groupEnd = utils.emptyFunction;

Appender.prototype.toString = function() {
  utils.handleError("Appender.toString: all appenders must override this method");
};

module.exports = exports = Appender;