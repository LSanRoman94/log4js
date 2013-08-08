var utils = require('../util/util');

/* ---------------------------------------------------------------------- */
// Date-related stuff

var SimpleDateFormat;



var regex = /('[^']*')|(G+|y+|M+|w+|W+|D+|d+|F+|E+|a+|H+|k+|K+|h+|m+|s+|S+|Z+)|([a-zA-Z]+)|([^a-zA-Z']+)/;
var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var TEXT2 = 0, TEXT3 = 1, NUMBER = 2, YEAR = 3, MONTH = 4, TIMEZONE = 5;
var types = {
  G : TEXT2,
  y : YEAR,
  M : MONTH,
  w : NUMBER,
  W : NUMBER,
  D : NUMBER,
  d : NUMBER,
  F : NUMBER,
  E : TEXT3,
  a : TEXT2,
  H : NUMBER,
  k : NUMBER,
  K : NUMBER,
  h : NUMBER,
  m : NUMBER,
  s : NUMBER,
  S : NUMBER,
  Z : TIMEZONE
};
var ONE_DAY = 24 * 60 * 60 * 1000;
var ONE_WEEK = 7 * ONE_DAY;
var DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK = 1;

SimpleDateFormat = function(formatString) {
  this.formatString = formatString;
};

/**
 * Sets the minimum number of days in a week in order for that week to
 * be considered as belonging to a particular month or year
 */
SimpleDateFormat.prototype.setMinimalDaysInFirstWeek = function(days) {
  this.minimalDaysInFirstWeek = days;
};

SimpleDateFormat.prototype.getMinimalDaysInFirstWeek = function() {
  return utils.isUndefined(this.minimalDaysInFirstWeek)	?
    DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK : this.minimalDaysInFirstWeek;
};

var padWithZeroes = function(str, len) {
  while (str.length < len) {
    str = "0" + str;
  }
  return str;
};

var formatText = function(data, numberOfLetters, minLength) {
  return (numberOfLetters >= 4) ? data : data.substr(0, Math.max(minLength, numberOfLetters));
};

var formatNumber = function(data, numberOfLetters) {
  var dataString = "" + data;
  // Pad with 0s as necessary
  return padWithZeroes(dataString, numberOfLetters);
};

SimpleDateFormat.prototype.format = function(date) {
  var formattedString = "";
  var result;
  var searchString = this.formatString;
  while ((result = regex.exec(searchString))) {
    var quotedString = result[1];
    var patternLetters = result[2];
    var otherLetters = result[3];
    var otherCharacters = result[4];

    // If the pattern matched is quoted string, output the text between the quotes
    if (quotedString) {
      if (quotedString == "''") {
        formattedString += "'";
      } else {
        formattedString += quotedString.substring(1, quotedString.length - 1);
      }
    } else if (otherLetters) {
      // Swallow non-pattern letters by doing nothing here
    } else if (otherCharacters) {
      // Simply output other characters
      formattedString += otherCharacters;
    } else if (patternLetters) {
      // Replace pattern letters
      var patternLetter = patternLetters.charAt(0);
      var numberOfLetters = patternLetters.length;
      var rawData = "";
      switch(patternLetter) {
        case "G":
          rawData = "AD";
          break;
        case "y":
          rawData = date.getFullYear();
          break;
        case "M":
          rawData = date.getMonth();
          break;
        case "w":
          rawData = date.getWeekInYear(this.getMinimalDaysInFirstWeek());
          break;
        case "W":
          rawData = date.getWeekInMonth(this.getMinimalDaysInFirstWeek());
          break;
        case "D":
          rawData = date.getDayInYear();
          break;
        case "d":
          rawData = date.getDate();
          break;
        case "F":
          rawData = 1 + Math.floor((date.getDate() - 1) / 7);
          break;
        case "E":
          rawData = dayNames[date.getDay()];
          break;
        case "a":
          rawData = (date.getHours() >= 12) ? "PM" : "AM";
          break;
        case "H":
          rawData = date.getHours();
          break;
        case "k":
          rawData = date.getHours() || 24;
          break;
        case "K":
          rawData = date.getHours() % 12;
          break;
        case "h":
          rawData = (date.getHours() % 12) || 12;
          break;
        case "m":
          rawData = date.getMinutes();
          break;
        case "s":
          rawData = date.getSeconds();
          break;
        case "S":
          rawData = date.getMilliseconds();
          break;
        case "Z":
          rawData = date.getTimezoneOffset(); // This returns the number of minutes since GMT was this time.
          break;
      }
      // Format the raw data depending on the type
      switch(types[patternLetter]) {
        case TEXT2:
          formattedString += formatText(rawData, numberOfLetters, 2);
          break;
        case TEXT3:
          formattedString += formatText(rawData, numberOfLetters, 3);
          break;
        case NUMBER:
          formattedString += formatNumber(rawData, numberOfLetters);
          break;
        case YEAR:
          if (numberOfLetters <= 3) {
            // Output a 2-digit year
            var dataString = "" + rawData;
            formattedString += dataString.substr(2, 2);
          } else {
            formattedString += formatNumber(rawData, numberOfLetters);
          }
          break;
        case MONTH:
          if (numberOfLetters >= 3) {
            formattedString += formatText(monthNames[rawData], numberOfLetters, numberOfLetters);
          } else {
            // NB. Months returned by getMonth are zero-based
            formattedString += formatNumber(rawData + 1, numberOfLetters);
          }
          break;
        case TIMEZONE:
          var isPositive = (rawData > 0);
          // The following line looks like a mistake but isn't
          // because of the way getTimezoneOffset measures.
          var prefix = isPositive ? "-" : "+";
          var absData = Math.abs(rawData);

          // Hours
          var hours = "" + Math.floor(absData / 60);
          hours = padWithZeroes(hours, 2);
          // Minutes
          var minutes = "" + (absData % 60);
          minutes = padWithZeroes(minutes, 2);

          formattedString += prefix + hours + minutes;
          break;
      }
    }
    searchString = searchString.substr(result.index + result[0].length);
  }
  return formattedString;
};

module.exports = exports = SimpleDateFormat;
