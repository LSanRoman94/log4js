
module.exports = exports;

exports.showStackTraces = false;
exports.useTimeStampsInMilliseconds = true;
exports.applicationStartDate = new Date();
exports.uniqueId = "log4javascript_" + exports.applicationStartDate.getTime() + "_" +
  Math.floor(Math.random() * 100000000);
