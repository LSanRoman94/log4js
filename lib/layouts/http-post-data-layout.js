/* ---------------------------------------------------------------------- */
// HttpPostDataLayout

var Layout = require('./layout');
var utils = require('../util/util');

function HttpPostDataLayout() {
  this.setKeys();
  this.customFields = [];
  this.returnsPostData = true;
}

HttpPostDataLayout.prototype = new Layout();

// Disable batching
HttpPostDataLayout.prototype.allowBatching = function() {
  return false;
};

HttpPostDataLayout.prototype.format = function(loggingEvent) {
  var dataValues = this.getDataValues(loggingEvent);
  var queryBits = [];
  for (var i = 0, len = dataValues.length; i < len; i++) {
    var val = (dataValues[i][1] instanceof Date) ?
      String(dataValues[i][1].getTime()) : dataValues[i][1];
    queryBits.push(utils.urlEncode(dataValues[i][0]) + "=" + utils.urlEncode(val));
  }
  return queryBits.join("&");
};

HttpPostDataLayout.prototype.ignoresThrowable = function(loggingEvent) {
  return false;
};

HttpPostDataLayout.prototype.toString = function() {
  return "HttpPostDataLayout";
};

module.exports = exports = HttpPostDataLayout;