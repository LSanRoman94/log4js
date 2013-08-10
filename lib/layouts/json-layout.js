/* ---------------------------------------------------------------------- */
// JsonLayout related
var Layout = require('./layout');
var utils = require('../util/util');
var newLine = utils.newLine;

function escapeNewLines(str) {
  return str.replace(/\r\n|\r|\n/g, "\\r\\n");
}

function JsonLayout(log4js, readable, combineMessages) {
  this.log4js = log4js;
  this.readable = utils.extractBooleanFromParam(readable, false);
  this.combineMessages = utils.extractBooleanFromParam(combineMessages, true);
  this.batchHeader = this.readable ? "[" + newLine : "[";
  this.batchFooter = this.readable ? "]" + newLine : "]";
  this.batchSeparator = this.readable ? "," + newLine : ",";
  this.setKeys();
  this.colon = this.readable ? ": " : ":";
  this.tab = this.readable ? "\t" : "";
  this.lineBreak = this.readable ? newLine : "";
  this.customFields = [];
}

/* ---------------------------------------------------------------------- */
// JsonLayout

JsonLayout.prototype = new Layout();

JsonLayout.prototype.isReadable = function() {
  return this.readable;
};

JsonLayout.prototype.isCombinedMessages = function() {
  return this.combineMessages;
};

JsonLayout.prototype.format = function(loggingEvent) {
  var layout = this;
  var dataValues = this.getDataValues(loggingEvent, this.combineMessages);
  var str = "{" + this.lineBreak;
  var i, len;

  function formatValue(val, prefix, expand) {
    // Check the type of the data value to decide whether quotation marks
    // or expansion are required
    var formattedValue;
    var valType = typeof val;
    if (val instanceof Date) {
      formattedValue = String(val.getTime());
    } else if (expand && (val instanceof Array)) {
      formattedValue = "[" + layout.lineBreak;
      for (var i = 0, len = val.length; i < len; i++) {
        var childPrefix = prefix + layout.tab;
        formattedValue += childPrefix + formatValue(val[i], childPrefix, false);
        if (i < val.length - 1) {
          formattedValue += ",";
        }
        formattedValue += layout.lineBreak;
      }
      formattedValue += prefix + "]";
    } else if (valType !== "number" && valType !== "boolean") {
      formattedValue = "\"" + escapeNewLines(utils.toStr(val).replace(/\"/g, "\\\"")) + "\"";
    } else {
      formattedValue = val;
    }
    return formattedValue;
  }

  for (i = 0, len = dataValues.length - 1; i <= len; i++) {
    str += this.tab + "\"" + dataValues[i][0] + "\"" + this.colon + formatValue(dataValues[i][1], this.tab, true);
    if (i < len) {
      str += ",";
    }
    str += this.lineBreak;
  }

  str += "}" + this.lineBreak;
  return str;
};

JsonLayout.prototype.ignoresThrowable = function() {
  return false;
};

JsonLayout.prototype.toString = function() {
  return "JsonLayout";
};

JsonLayout.prototype.getContentType = function() {
  return "application/json";
};

module.exports = exports = JsonLayout;