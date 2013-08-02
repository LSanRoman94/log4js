var logLog = require('./logLog');
var log4js = require('../log4js');

module.exports = exports;

var newLine = exports.newLine = "\r\n";

var isUndefined = exports.isUndefined = function(obj) {
  return typeof obj == "undefined";
};

var handleError = exports.handleError = function(message, exception) {
  logLog.error(message, exception);
  log4javascript.dispatchEvent("error", { "message": message, "exception": exception });
}

exports.extractStringFromParam = function(param, defaultValue) {
  if (isUndefined(param)) {
    return defaultValue;
  } else {
    return String(param);
  }
}


var toStr = exports.toStr = function(obj) {
  if (obj && obj.toString) {
    return obj.toString();
  } else {
    return String(obj);
  }
}

var getExceptionMessage = exports.getExceptionMessage = function(ex) {
  if (ex.message) {
    return ex.message;
  } else if (ex.description) {
    return ex.description;
  } else {
    return toStr(ex);
  }
}

// Gets the portion of the URL after the last slash
var getUrlFileName = exports.getUrlFileName = function(url) {
  var lastSlashIndex = Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\"));
  return url.substr(lastSlashIndex + 1);
}

// Returns a nicely formatted representation of an error
var getExceptionStringRep = exports.getExceptionStringRep = function(ex) {
  if (ex) {
    var exStr = "Exception: " + getExceptionMessage(ex);
    try {
      if (ex.lineNumber) {
        exStr += " on line number " + ex.lineNumber;
      }
      if (ex.fileName) {
        exStr += " in file " + getUrlFileName(ex.fileName);
      }
    } catch (localEx) {
      logLog.warn("Unable to obtain file and line information for error");
    }
    if (log4js.showStackTraces && ex.stack) {
      exStr += newLine + "Stack trace:" + newLine + ex.stack;
    }
    return exStr;
  }
  return null;
}