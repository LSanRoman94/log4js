
/* ---------------------------------------------------------------------- */
// Timers

var utils = require('./util');
var Level = require('../level');

function Timer(name, level) {
  this.name = name;
  this.level = utils.isUndefined(level) ? Level.INFO : level;
  this.start = new Date();
}

Timer.prototype.getElapsedTime = function() {
  return new Date().getTime() - this.start.getTime();
};

module.exports = exports = Timer;