module.exports = exports;

var log4js;
exports.setLog4js = function(log4jsObj) {
  log4js = log4jsObj;
}

exports.inherit = function() {
  function noop(){}

  function ecma3(ctor, superCtor) {
    noop.prototype = superCtor.prototype;
    ctor.prototype = new noop;
    ctor.prototype.constructor = superCtor;
  }

  function ecma5(ctor, superCtor) {
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: { value: ctor, enumerable: false }
    });
  }

  return Object.create ? ecma5 : ecma3;
}

var newLine = exports.newLine = "\r\n";
var emptyFunction = exports.emptyFunction = function() {};

var isUndefined = exports.isUndefined = function(obj) {
  return typeof obj == "undefined";
};

var handleError = exports.handleError = function(message, exception) {
  log4javascript.dispatchEvent("error", { "message": message, "exception": exception });
};

exports.extractStringFromParam = function(param, defaultValue) {
  if (isUndefined(param)) {
    return defaultValue;
  } else {
    return String(param);
  }
};

exports.extractBooleanFromParam = function(param, defaultValue) {
  if (isUndefined(param)) {
    return defaultValue;
  } else {
    return bool(param);
  }
}

exports.extractIntFromParam = function(param, defaultValue) {
  if (isUndefined(param)) {
    return defaultValue;
  } else {
    try {
      var value = parseInt(param, 10);
      return isNaN(value) ? defaultValue : value;
    } catch (ex) {
      return defaultValue;
    }
  }
}

exports.extractFunctionFromParam = function(param, defaultValue) {
  if (typeof param == "function") {
    return param;
  } else {
    return defaultValue;
  }
}

var bool = exports.bool = function(obj) {
  return Boolean(obj);
}

exports.isError = function(err) {
  return (err instanceof Error);
}

var encodeFunc = function(str) {
  return encodeURIComponent(str);
};
var noEncodeFunc = function(str) {
  return escape(str).replace(/\+/g, "%2B").replace(/"/g, "%22").replace(/'/g, "%27").replace(/\//g, "%2F").replace(/=/g, "%3D");
};

var urlEncode;
var str = encodeURIComponent('asdfadsfadsf');
try {
  urlEncode = window.encodeURIComponent;
} catch (err) {
  urlEncode = noEncodeFunc;
}
exports.urlEncode = urlEncode;

var toStr = exports.toStr = function(obj) {
  if (obj && obj.toString) {
    return obj.toString();
  } else {
    return String(obj);
  }
};

var getExceptionMessage = exports.getExceptionMessage = function(ex) {
  if (ex.message) {
    return ex.message;
  } else if (ex.description) {
    return ex.description;
  } else {
    return toStr(ex);
  }
};

// Gets the portion of the URL after the last slash
var getUrlFileName = exports.getUrlFileName = function(url) {
  var lastSlashIndex = Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\"));
  return url.substr(lastSlashIndex + 1);
};

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
    } catch (localEx) { }
    if (log4js.showStackTraces && ex.stack) {
      exStr += newLine + "Stack trace:" + newLine + ex.stack;
    }
    return exStr;
  }
  return null;
};

var array_remove = exports.array_remove = function array_remove(arr, val) {
  var index = -1;
  for (var i = 0, len = arr.length; i < len; i++) {
    if (arr[i] === val) {
      index = i;
      break;
    }
  }
  if (index >= 0) {
    arr.splice(index, 1);
    return true;
  } else {
    return false;
  }
};

var array_contains = exports.array_contains = function(arr, val) {
  for(var i = 0, len = arr.length; i < len; i++) {
    if (arr[i] == val) {
      return true;
    }
  }
  return false;
}

/* ---------------------------------------------------------------------- */
// formatObjectExpansion

function splitIntoLines(text) {
  // Ensure all line breaks are \n only
  var text2 = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return text2.split("\n");
}

var formatObjectExpansion = exports.formatObjectExpansion = function(obj, depth, indentation) {
  var objectsExpanded = [];

  function doFormat(obj, depth, indentation) {
    var i, len, childDepth, childIndentation, childLines, expansion,
      childExpansion;

    if (!indentation) {
      indentation = "";
    }

    function formatString(text) {
      var lines = splitIntoLines(text);
      for (var j = 1, jLen = lines.length; j < jLen; j++) {
        lines[j] = indentation + lines[j];
      }
      return lines.join(newLine);
    }

    if (obj === null) {
      return "null";
    } else if (typeof obj == "undefined") {
      return "undefined";
    } else if (typeof obj == "string") {
      return formatString(obj);
    } else if (typeof obj == "object" && array_contains(objectsExpanded, obj)) {
      try {
        expansion = toStr(obj);
      } catch (ex) {
        expansion = "Error formatting property. Details: " + getExceptionStringRep(ex);
      }
      return expansion + " [already expanded]";
    } else if ((obj instanceof Array) && depth > 0) {
      objectsExpanded.push(obj);
      expansion = "[" + newLine;
      childDepth = depth - 1;
      childIndentation = indentation + "  ";
      childLines = [];
      for (i = 0, len = obj.length; i < len; i++) {
        try {
          childExpansion = doFormat(obj[i], childDepth, childIndentation);
          childLines.push(childIndentation + childExpansion);
        } catch (ex) {
          childLines.push(childIndentation + "Error formatting array member. Details: " +
            getExceptionStringRep(ex) + "");
        }
      }
      expansion += childLines.join("," + newLine) + newLine + indentation + "]";
      return expansion;
    } else if (Object.prototype.toString.call(obj) == "[object Date]") {
      return obj.toString();
    } else if (typeof obj == "object" && depth > 0) {
      objectsExpanded.push(obj);
      expansion = "{" + newLine;
      childDepth = depth - 1;
      childIndentation = indentation + "  ";
      childLines = [];
      for (i in obj) {
        try {
          childExpansion = doFormat(obj[i], childDepth, childIndentation);
          childLines.push(childIndentation + i + ": " + childExpansion);
        } catch (ex) {
          childLines.push(childIndentation + i + ": Error formatting property. Details: " +
            getExceptionStringRep(ex));
        }
      }
      expansion += childLines.join("," + newLine) + newLine + indentation + "}";
      return expansion;
    } else {
      return formatString(toStr(obj));
    }
  }
  return doFormat(obj, depth, indentation);
};