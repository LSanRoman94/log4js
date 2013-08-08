/* ---------------------------------------------------------------------- */
// XmlLayout
var Layout = require('./layout');
var log4js = require('../log4js');
var utils = require('../util/util');
var newLine = utils.newLine;

function XmlLayout(combineMessages) {
  this.combineMessages = utils.extractBooleanFromParam(combineMessages, true);
  this.customFields = [];
}

XmlLayout.prototype = new Layout();

XmlLayout.prototype.isCombinedMessages = function() {
  return this.combineMessages;
};

XmlLayout.prototype.getContentType = function() {
  return "text/xml";
};

XmlLayout.prototype.escapeCdata = function(str) {
  return str.replace(/\]\]>/, "]]>]]&gt;<![CDATA[");
};

XmlLayout.prototype.format = function(loggingEvent) {
  var layout = this;
  var i, len;
  function formatMessage(message) {
    message = (typeof message === "string") ? message : utils.toStr(message);
    return "<log4javascript:message><![CDATA[" +
      layout.escapeCdata(message) + "]]></log4javascript:message>";
  }

  var str = "<log4javascript:event logger=\"" + loggingEvent.logger.name +
    "\" timestamp=\"" + this.getTimeStampValue(loggingEvent) + "\"";
  if (!log4js.useTimeStampsInMilliseconds) {
    str += " milliseconds=\"" + loggingEvent.milliseconds + "\"";
  }
  str += " level=\"" + loggingEvent.level.name + "\">" + newLine;
  if (this.combineMessages) {
    str += formatMessage(loggingEvent.getCombinedMessages());
  } else {
    str += "<log4javascript:messages>" + newLine;
    for (i = 0, len = loggingEvent.messages.length; i < len; i++) {
      str += formatMessage(loggingEvent.messages[i]) + newLine;
    }
    str += "</log4javascript:messages>" + newLine;
  }
  if (this.hasCustomFields()) {
    for (i = 0, len = this.customFields.length; i < len; i++) {
      str += "<log4javascript:customfield name=\"" +
        this.customFields[i].name + "\"><![CDATA[" +
        this.customFields[i].value.toString() +
        "]]></log4javascript:customfield>" + newLine;
    }
  }
  if (loggingEvent.exception) {
    str += "<log4javascript:exception><![CDATA[" +
      utils.getExceptionStringRep(loggingEvent.exception) +
      "]]></log4javascript:exception>" + newLine;
  }
  str += "</log4javascript:event>" + newLine + newLine;
  return str;
};

XmlLayout.prototype.ignoresThrowable = function() {
  return false;
};

XmlLayout.prototype.toString = function() {
  return "XmlLayout";
};

module.exports = exports = XmlLayout;