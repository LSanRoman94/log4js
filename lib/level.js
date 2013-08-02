/* ---------------------------------------------------------------------- */
// Levels

var Level = function(level, name) {
  this.level = level;
  this.name = name;
};

Level.prototype = {
  toString: function() {
    return this.name;
  },
  equals: function(level) {
    return this.level == level.level;
  },
  isGreaterOrEqual: function(level) {
    return this.level >= level.level;
  }
};

Level.ALL = new Level(Number.MIN_VALUE, "ALL");
Level.TRACE = new Level(10000, "TRACE");
Level.DEBUG = new Level(20000, "DEBUG");
Level.INFO = new Level(30000, "INFO");
Level.WARN = new Level(40000, "WARN");
Level.ERROR = new Level(50000, "ERROR");
Level.FATAL = new Level(60000, "FATAL");
Level.OFF = new Level(Number.MAX_VALUE, "OFF");

module.exports = exports = Level;
