var utils = require('../util/util');
var isUndefined = utils.isUndefined;
var handleError = utils.handleError;
var extractStringFromParam = utils.extractStringFromParam;

/* ---------------------------------------------------------------------- */
// Layout prototype

var Layout = function() {};

Layout.prototype = {
  defaults: {
    loggerKey: "logger",
    timeStampKey: "timestamp",
    millisecondsKey: "milliseconds",
    levelKey: "level",
    messageKey: "message",
    exceptionKey: "exception",
    urlKey: "url"
  },
  loggerKey: "logger",
  timeStampKey: "timestamp",
  millisecondsKey: "milliseconds",
  levelKey: "level",
  messageKey: "message",
  exceptionKey: "exception",
  urlKey: "url",
  batchHeader: "",
  batchFooter: "",
  batchSeparator: "",
  returnsPostData: false,
  overrideTimeStampsSetting: false,
  useTimeStampsInMilliseconds: null,

  format: function() {
    handleError("Layout.format: layout supplied has no format() method");
  },

  ignoresThrowable: function() {
    handleError("Layout.ignoresThrowable: layout supplied has no ignoresThrowable() method");
  },

  getContentType: function() {
    return "text/plain";
  },

  allowBatching: function() {
    return true;
  },

  setTimeStampsInMilliseconds: function(timeStampsInMilliseconds) {
    this.overrideTimeStampsSetting = true;
    this.useTimeStampsInMilliseconds = utils.bool(timeStampsInMilliseconds);
  },

  isTimeStampsInMilliseconds: function() {
    return this.overrideTimeStampsSetting ?
      this.useTimeStampsInMilliseconds : this.log4js.useTimeStampsInMilliseconds;
  },

  getTimeStampValue: function(loggingEvent) {
    return this.isTimeStampsInMilliseconds() ?
      loggingEvent.timeStampInMilliseconds : loggingEvent.timeStampInSeconds;
  },

  getDataValues: function(loggingEvent, combineMessages) {

    var urlKey;
    try {
      urlKey = window.location.href;
    } catch(err) {
      urlKey = '';
    }

    var dataValues = [
      [this.loggerKey, loggingEvent.logger.name],
      [this.timeStampKey, this.getTimeStampValue(loggingEvent)],
      [this.levelKey, loggingEvent.level.name],
      [this.urlKey, urlKey],
      [this.messageKey, combineMessages ? loggingEvent.getCombinedMessages() : loggingEvent.messages]
    ];
    if (!this.isTimeStampsInMilliseconds()) {
      dataValues.push([this.millisecondsKey, loggingEvent.milliseconds]);
    }
    if (loggingEvent.exception) {
      dataValues.push([this.exceptionKey, utils.getExceptionStringRep(loggingEvent.exception)]);
    }
    if (this.hasCustomFields()) {
      for (var i = 0, len = this.customFields.length; i < len; i++) {
        var val = this.customFields[i].value;

        // Check if the value is a function. If so, execute it, passing it the
        // current layout and the logging event
        if (typeof val === "function") {
          val = val(this, loggingEvent);
        }
        dataValues.push([this.customFields[i].name, val]);
      }
    }
    return dataValues;
  },

  setKeys: function(loggerKey, timeStampKey, levelKey, messageKey,
                    exceptionKey, urlKey, millisecondsKey) {
    this.loggerKey = extractStringFromParam(loggerKey, this.defaults.loggerKey);
    this.timeStampKey = extractStringFromParam(timeStampKey, this.defaults.timeStampKey);
    this.levelKey = extractStringFromParam(levelKey, this.defaults.levelKey);
    this.messageKey = extractStringFromParam(messageKey, this.defaults.messageKey);
    this.exceptionKey = extractStringFromParam(exceptionKey, this.defaults.exceptionKey);
    this.urlKey = extractStringFromParam(urlKey, this.defaults.urlKey);
    this.millisecondsKey = extractStringFromParam(millisecondsKey, this.defaults.millisecondsKey);
  },

  setCustomField: function(name, value) {
    var fieldUpdated = false;
    for (var i = 0, len = this.customFields.length; i < len; i++) {
      if (this.customFields[i].name === name) {
        this.customFields[i].value = value;
        fieldUpdated = true;
      }
    }
    if (!fieldUpdated) {
      this.customFields.push({"name": name, "value": value});
    }
  },

  hasCustomFields: function() {
    return (this.customFields.length > 0);
  },

  toString: function() {
    handleError("Layout.toString: all layouts must override this method");
  }
};

module.exports = exports = Layout;