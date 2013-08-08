var handleError = require('./util/util').handleError;
var array_remove = require('./util/util').array_remove;
var array_contains = require('./util/util').array_contains;

/* ---------------------------------------------------------------------- */
// Custom event support

function EventSupport() {}

EventSupport.prototype = {
  eventTypes: [],
  eventListeners: {},
  setEventTypes: function(eventTypesParam) {
    if (eventTypesParam instanceof Array) {
      this.eventTypes = eventTypesParam;
      this.eventListeners = {};
      for (var i = 0, len = this.eventTypes.length; i < len; i++) {
        this.eventListeners[this.eventTypes[i]] = [];
      }
    } else {
      handleError("log4javascript.EventSupport [" + this + "]: setEventTypes: eventTypes parameter must be an Array");
    }
  },

  addEventListener: function(eventType, listener) {
    if (typeof listener == "function") {
      if (!array_contains(this.eventTypes, eventType)) {
        handleError("log4javascript.EventSupport [" + this + "]: addEventListener: no event called '" + eventType + "'");
      }
      this.eventListeners[eventType].push(listener);
    } else {
      handleError("log4javascript.EventSupport [" + this + "]: addEventListener: listener must be a function");
    }
  },

  removeEventListener: function(eventType, listener) {
    if (typeof listener == "function") {
      if (!array_contains(this.eventTypes, eventType)) {
        handleError("log4javascript.EventSupport [" + this + "]: removeEventListener: no event called '" + eventType + "'");
      }
      array_remove(this.eventListeners[eventType], listener);
    } else {
      handleError("log4javascript.EventSupport [" + this + "]: removeEventListener: listener must be a function");
    }
  },

  dispatchEvent: function(eventType, eventArgs) {
    if (array_contains(this.eventTypes, eventType)) {
      var listeners = this.eventListeners[eventType];
      for (var i = 0, len = listeners.length; i < len; i++) {
        listeners[i](this, eventType, eventArgs);
      }
    } else {
      handleError("log4javascript.EventSupport [" + this + "]: dispatchEvent: no event called '" + eventType + "'");
    }
  }
};

module.exports = exports = EventSupport;