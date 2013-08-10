var utils = require('../util/util');
var Layout = require('./layout');
var SimpleDateFormat = require('../formats/simple-date-format');

/* ---------------------------------------------------------------------- */
// PatternLayout

function PatternLayout(log4js, pattern) {
  this.log4js = log4js;
  if (pattern) {
    this.pattern = pattern;
  } else {
    this.pattern = PatternLayout.DEFAULT_CONVERSION_PATTERN;
  }
  this.customFields = [];
}

PatternLayout.TTCC_CONVERSION_PATTERN = "%r %p %c - %m%n";
PatternLayout.DEFAULT_CONVERSION_PATTERN = "%m%n";
PatternLayout.ISO8601_DATEFORMAT = "yyyy-MM-dd HH:mm:ss,SSS";
PatternLayout.DATETIME_DATEFORMAT = "dd MMM yyyy HH:mm:ss,SSS";
PatternLayout.ABSOLUTETIME_DATEFORMAT = "HH:mm:ss,SSS";

PatternLayout.prototype = new Layout();

PatternLayout.prototype.format = function(loggingEvent) {
  var regex = /%(-?[0-9]+)?(\.?[0-9]+)?([acdfmMnpr%])(\{([^\}]+)\})?|([^%]+)/;
  var formattedString = "";
  var result;
  var searchString = this.pattern;

  // Cannot use regex global flag since it doesn't work with exec in IE5
  while ((result = regex.exec(searchString))) {
    var matchedString = result[0];
    var padding = result[1];
    var truncation = result[2];
    var conversionCharacter = result[3];
    var specifier = result[5];
    var text = result[6];

    // Check if the pattern matched was just normal text
    if (text) {
      formattedString += "" + text;
    } else {
      // Create a raw replacement string based on the conversion
      // character and specifier
      var replacement = "";
      switch(conversionCharacter) {
        case "a": // Array of messages
        case "m": // Message
          var depth = 0;
          if (specifier) {
            depth = parseInt(specifier, 10);
            if (isNaN(depth)) {
              utils.handleError("PatternLayout.format: invalid specifier '" +
                specifier + "' for conversion character '" + conversionCharacter +
                "' - should be a number");
              depth = 0;
            }
          }
          var messages = (conversionCharacter === "a") ? loggingEvent.messages[0] : loggingEvent.messages;
          for (var i = 0, len = messages.length; i < len; i++) {
            if (i > 0 && (replacement.charAt(replacement.length - 1) !== " ")) {
              replacement += " ";
            }
            if (depth === 0) {
              replacement += messages[i];
            } else {
              replacement += utils.formatObjectExpansion(messages[i], depth);
            }
          }
          break;
        case "c": // Logger name
          var loggerName = loggingEvent.logger.name;
          if (specifier) {
            var precision = parseInt(specifier, 10);
            var loggerNameBits = loggingEvent.logger.name.split(".");
            if (precision >= loggerNameBits.length) {
              replacement = loggerName;
            } else {
              replacement = loggerNameBits.slice(loggerNameBits.length - precision).join(".");
            }
          } else {
            replacement = loggerName;
          }
          break;
        case "d": // Date
          var dateFormat = PatternLayout.ISO8601_DATEFORMAT;
          if (specifier) {
            dateFormat = specifier;
            // Pick up special cases
            if (dateFormat == "ISO8601") {
              dateFormat = PatternLayout.ISO8601_DATEFORMAT;
            } else if (dateFormat == "ABSOLUTE") {
              dateFormat = PatternLayout.ABSOLUTETIME_DATEFORMAT;
            } else if (dateFormat == "DATE") {
              dateFormat = PatternLayout.DATETIME_DATEFORMAT;
            }
          }
          // Format the date
          replacement = (new SimpleDateFormat(dateFormat)).format(loggingEvent.timeStamp);
          break;
        case "f": // Custom field
          if (this.hasCustomFields()) {
            var fieldIndex = 0;
            if (specifier) {
              fieldIndex = parseInt(specifier, 10);
              if (isNaN(fieldIndex)) {
                utils.handleError("PatternLayout.format: invalid specifier '" +
                  specifier + "' for conversion character 'f' - should be a number");
              } else if (fieldIndex === 0) {
                utils.handleError("PatternLayout.format: invalid specifier '" +
                  specifier + "' for conversion character 'f' - must be greater than zero");
              } else if (fieldIndex > this.customFields.length) {
                utils.handleError("PatternLayout.format: invalid specifier '" +
                  specifier + "' for conversion character 'f' - there aren't that many custom fields");
              } else {
                fieldIndex = fieldIndex - 1;
              }
            }
            var val = this.customFields[fieldIndex].value;
            if (typeof val == "function") {
              val = val(this, loggingEvent);
            }
            replacement = val;
          }
          break;
        case "n": // New line
          replacement = utils.newLine;
          break;
        case "p": // Level
          replacement = loggingEvent.level.name;
          break;
        case "r": // Milliseconds since log4javascript startup
          replacement = "" + loggingEvent.timeStamp.getDifference(this.log4js.applicationStartDate);
          break;
        case "%": // Literal % sign
          replacement = "%";
          break;
        default:
          replacement = matchedString;
          break;
      }
      // Format the replacement according to any padding or
      // truncation specified
      var l;

      // First, truncation
      if (truncation) {
        l = parseInt(truncation.substr(1), 10);
        var strLen = replacement.length;
        if (l < strLen) {
          replacement = replacement.substring(strLen - l, strLen);
        }
      }
      // Next, padding
      if (padding) {
        if (padding.charAt(0) == "-") {
          l = parseInt(padding.substr(1), 10);
          // Right pad with spaces
          while (replacement.length < l) {
            replacement += " ";
          }
        } else {
          l = parseInt(padding, 10);
          // Left pad with spaces
          while (replacement.length < l) {
            replacement = " " + replacement;
          }
        }
      }
      formattedString += replacement;
    }
    searchString = searchString.substr(result.index + result[0].length);
  }
  return formattedString;
};

PatternLayout.prototype.ignoresThrowable = function() {
  return true;
};

PatternLayout.prototype.toString = function() {
  return "PatternLayout";
};

module.exports = exports = PatternLayout;