var isUndefined = require('../util/util').isUndefined;

/* ---------------------------------------------------------------------- */
// Date-related stuff


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

var newDateAtMidnight = function(year, month, day) {
  var d = new Date(year, month, day, 0, 0, 0);
  d.setMilliseconds(0);
  return d;
};

Date.prototype.getDifference = function(date) {
  return this.getTime() - date.getTime();
};

Date.prototype.isBefore = function(d) {
  return this.getTime() < d.getTime();
};

Date.prototype.getUTCTime = function() {
  return Date.UTC(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(),
    this.getSeconds(), this.getMilliseconds());
};

Date.prototype.getTimeSince = function(d) {
  return this.getUTCTime() - d.getUTCTime();
};

Date.prototype.getPreviousSunday = function() {
  // Using midday avoids any possibility of DST messing things up
  var midday = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 12, 0, 0);
  var previousSunday = new Date(midday.getTime() - this.getDay() * ONE_DAY);
  return newDateAtMidnight(previousSunday.getFullYear(), previousSunday.getMonth(),
    previousSunday.getDate());
};

Date.prototype.getWeekInYear = function(minimalDaysInFirstWeek) {
  if (isUndefined(this.minimalDaysInFirstWeek)) {
    minimalDaysInFirstWeek = DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
  }
  var previousSunday = this.getPreviousSunday();
  var startOfYear = newDateAtMidnight(this.getFullYear(), 0, 1);
  var numberOfSundays = previousSunday.isBefore(startOfYear) ?
    0 : 1 + Math.floor(previousSunday.getTimeSince(startOfYear) / ONE_WEEK);
  var numberOfDaysInFirstWeek =  7 - startOfYear.getDay();
  var weekInYear = numberOfSundays;
  if (numberOfDaysInFirstWeek < minimalDaysInFirstWeek) {
    weekInYear--;
  }
  return weekInYear;
};

Date.prototype.getWeekInMonth = function(minimalDaysInFirstWeek) {
  if (isUndefined(this.minimalDaysInFirstWeek)) {
    minimalDaysInFirstWeek = DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
  }
  var previousSunday = this.getPreviousSunday();
  var startOfMonth = newDateAtMidnight(this.getFullYear(), this.getMonth(), 1);
  var numberOfSundays = previousSunday.isBefore(startOfMonth) ?
    0 : 1 + Math.floor(previousSunday.getTimeSince(startOfMonth) / ONE_WEEK);
  var numberOfDaysInFirstWeek =  7 - startOfMonth.getDay();
  var weekInMonth = numberOfSundays;
  if (numberOfDaysInFirstWeek >= minimalDaysInFirstWeek) {
    weekInMonth++;
  }
  return weekInMonth;
};

Date.prototype.getDayInYear = function() {
  var startOfYear = newDateAtMidnight(this.getFullYear(), 0, 1);
  return 1 + Math.floor(this.getTimeSince(startOfYear) / ONE_DAY);
};

module.exports = exports = Date;


