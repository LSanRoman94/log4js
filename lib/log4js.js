
module.exports = exports;

exports.applicationStartDate = new Date();
exports.enabled = true;
exports.showStackTraces = false;
exports.useTimeStampsInMilliseconds = true;
exports.uniqueId = "log4javascript_" + exports.applicationStartDate.getTime() + "_" +
  Math.floor(Math.random() * 100000000);
