
var Appender = require('./appender');
var NullLayout = require('../layouts/null-layout');
var Level = require('../level');

function InMemoryQueueAppender(log4js) {
  this.log4js = log4js;
  this.queue = [];
  log4js.inMemoryLogger = this;
}

InMemoryQueueAppender.prototype = new Appender();

InMemoryQueueAppender.prototype.layout = new NullLayout();
InMemoryQueueAppender.prototype.threshold = Level.DEBUG;

InMemoryQueueAppender.prototype.append = function(loggingEvent) {
  var appender = this;

  var getFormattedMessage = function() {
    var layout = appender.getLayout();
    var messageObj = layout.format(loggingEvent);
    if (layout.ignoresThrowable() && loggingEvent.exception) {
      messageObj.exceptionInfo = loggingEvent.getThrowableStrRep();
    }
    return messageObj;
  };

  var formattedMessage = getFormattedMessage();
  this.queue.push(formattedMessage);
};

InMemoryQueueAppender.prototype.toString = function() {
  return "InMemoryQueueAppender";
};

InMemoryQueueAppender.prototype.dumpToConsole = function(numMessages) {
  if (numMessages != undefined && numMessages > 0 && numMessages < this.queue.length) {
    numMessages = this.queue.length - numMessages;
  } else {
    numMessages = 0;
  }

  for (var i = numMessages; i < this.queue.length; i++) {
    var message = this.queue[i];

    var level = message.level;
    try {
      if ('TRACE' === level || 'DEBUG' === level) {
        if (message.message) {
          console.debug(message.message, message);
        } else {
          console.debug(message);
        }
      } else if ('INFO' === level) {
        if (message.message) {
          console.info(message.message, message);
        } else {
          console.info(message);
        }
      } else if ('WARN' === level) {
        if (message.message) {
          console.info(message.message, message);
        } else {
          console.info(message);
        }
      } else if ('ERROR' === level || 'ERROR' === level) {
        if (message.message) {
          console.error(message.message, message);
        } else {
          console.error(message);
        }
      } else {
        console.log(message);
      }
    } catch (err) {}
  }
};

module.exports = exports = InMemoryQueueAppender;