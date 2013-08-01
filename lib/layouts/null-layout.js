/* ----------------------------------------------------------------------- */
// NullLayout

function NullLayout() {
  this.customFields = [];
}

NullLayout.prototype = new Layout();

NullLayout.prototype.format = function(loggingEvent) {
  return loggingEvent.messages;
};

NullLayout.prototype.ignoresThrowable = function() {
  return true;
};

NullLayout.prototype.toString = function() {
  return "NullLayout";
};

module.exports = exports = NullLayout;