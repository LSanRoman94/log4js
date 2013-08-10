/* ---------------------------------------------------------------------- */
// AjaxAppender

var HttpPostDataLayout = require('../layouts/http-post-data-layout');
var Appender = require('./appender');
var NullLayout = require('../layouts/null-layout');
var Level = require('../level');

var utils = require('../util/util');

function AjaxAppender(log4js, url) {
  this.log4js = log4js;
  var appender = this;
  var isSupported = true;
  if (!url) {
    utils.handleError("AjaxAppender: URL must be specified in constructor");
    isSupported = false;
  }

  var timed = this.defaults.timed;
  var waitForResponse = this.defaults.waitForResponse;
  var batchSize = this.defaults.batchSize;
  var timerInterval = this.defaults.timerInterval;
  var requestSuccessCallback = this.defaults.requestSuccessCallback;
  var failCallback = this.defaults.failCallback;
  var postVarName = this.defaults.postVarName;
  var sendAllOnUnload = this.defaults.sendAllOnUnload;
  var contentType = this.defaults.contentType;
  var sessionId = null;

  var queuedLoggingEvents = [];
  var queuedRequests = [];
  var headers = [];
  var sending = false;
  var initialized = false;

  // Configuration methods. The function scope is used to prevent
  // direct alteration to the appender configuration properties.
  function checkCanConfigure(configOptionName) {
    if (initialized) {
      utils.handleError("AjaxAppender: configuration option '" +
        configOptionName +
        "' may not be set after the appender has been initialized");
      return false;
    }
    return true;
  }

  this.getSessionId = function() { return sessionId; };
  this.setSessionId = function(sessionIdParam) {
    sessionId = utils.extractStringFromParam(sessionIdParam, null);
    this.layout.setCustomField("sessionid", sessionId);
  };

  this.setLayout = function(layoutParam) {
    if (checkCanConfigure("layout")) {
      this.layout = layoutParam;
      // Set the session id as a custom field on the layout, if not already present
      if (sessionId !== null) {
        this.setSessionId(sessionId);
      }
    }
  };

  this.isTimed = function() { return timed; };
  this.setTimed = function(timedParam) {
    if (checkCanConfigure("timed")) {
      timed = utils.bool(timedParam);
    }
  };

  this.getTimerInterval = function() { return timerInterval; };
  this.setTimerInterval = function(timerIntervalParam) {
    if (checkCanConfigure("timerInterval")) {
      timerInterval = utils.extractIntFromParam(timerIntervalParam, timerInterval);
    }
  };

  this.isWaitForResponse = function() { return waitForResponse; };
  this.setWaitForResponse = function(waitForResponseParam) {
    if (checkCanConfigure("waitForResponse")) {
      waitForResponse = utils.bool(waitForResponseParam);
    }
  };

  this.getBatchSize = function() { return batchSize; };
  this.setBatchSize = function(batchSizeParam) {
    if (checkCanConfigure("batchSize")) {
      batchSize = utils.extractIntFromParam(batchSizeParam, batchSize);
    }
  };

  this.isSendAllOnUnload = function() { return sendAllOnUnload; };
  this.setSendAllOnUnload = function(sendAllOnUnloadParam) {
    if (checkCanConfigure("sendAllOnUnload")) {
      sendAllOnUnload = utils.extractBooleanFromParam(sendAllOnUnloadParam, sendAllOnUnload);
    }
  };

  this.setRequestSuccessCallback = function(requestSuccessCallbackParam) {
    requestSuccessCallback = utils.extractFunctionFromParam(requestSuccessCallbackParam, requestSuccessCallback);
  };

  this.setFailCallback = function(failCallbackParam) {
    failCallback = utils.extractFunctionFromParam(failCallbackParam, failCallback);
  };

  this.getPostVarName = function() { return postVarName; };
  this.setPostVarName = function(postVarNameParam) {
    if (checkCanConfigure("postVarName")) {
      postVarName = utils.extractStringFromParam(postVarNameParam, postVarName);
    }
  };

  this.getHeaders = function() { return headers; };
  this.addHeader = function(name, value) {
    if (name.toLowerCase() == "content-type") {
      contentType = value;
    } else {
      headers.push( { name: name, value: value } );
    }
  };

  // Internal functions
  function sendAll() {
    if (isSupported && this.log4js.enabled) {
      sending = true;
      var currentRequestBatch;
      if (waitForResponse) {
        // Send the first request then use this function as the callback once
        // the response comes back
        if (queuedRequests.length > 0) {
          currentRequestBatch = queuedRequests.shift();
          sendRequest(preparePostData(currentRequestBatch), sendAll);
        } else {
          sending = false;
          if (timed) {
            scheduleSending();
          }
        }
      } else {
        // Rattle off all the requests without waiting to see the response
        while ((currentRequestBatch = queuedRequests.shift())) {
          sendRequest(preparePostData(currentRequestBatch));
        }
        sending = false;
        if (timed) {
          scheduleSending();
        }
      }
    }
  }

  this.sendAll = sendAll;

  // Called when the window unloads. At this point we're past caring about
  // waiting for responses or timers or incomplete batches - everything
  // must go, now
  function sendAllRemaining() {
    var sendingAnything = false;
    if (isSupported && this.log4js.enabled) {
      // Create requests for everything left over, batched as normal
      var actualBatchSize = appender.getLayout().allowBatching() ? batchSize : 1;
      var currentLoggingEvent;
      var batchedLoggingEvents = [];
      while ((currentLoggingEvent = queuedLoggingEvents.shift())) {
        batchedLoggingEvents.push(currentLoggingEvent);
        if (queuedLoggingEvents.length >= actualBatchSize) {
          // Queue this batch of log entries
          queuedRequests.push(batchedLoggingEvents);
          batchedLoggingEvents = [];
        }
      }
      // If there's a partially completed batch, add it
      if (batchedLoggingEvents.length > 0) {
        queuedRequests.push(batchedLoggingEvents);
      }
      sendingAnything = (queuedRequests.length > 0);
      waitForResponse = false;
      timed = false;
      sendAll();
    }
    return sendingAnything;
  }

  this.sendAllRemaining = sendAllRemaining;

  function preparePostData(batchedLoggingEvents) {
    // Format the logging events
    var formattedMessages = [];
    var currentLoggingEvent;
    var postData = "";
    while ((currentLoggingEvent = batchedLoggingEvents.shift())) {
      var currentFormattedMessage = appender.getLayout().format(currentLoggingEvent);
      if (appender.getLayout().ignoresThrowable()) {
        currentFormattedMessage += currentLoggingEvent.getThrowableStrRep();
      }
      formattedMessages.push(currentFormattedMessage);
    }
    // Create the post data string
    if (batchedLoggingEvents.length == 1) {
      postData = formattedMessages.join("");
    } else {
      postData = appender.getLayout().batchHeader +
        formattedMessages.join(appender.getLayout().batchSeparator) +
        appender.getLayout().batchFooter;
    }
    if (contentType == appender.defaults.contentType) {
      postData = appender.getLayout().returnsPostData ? postData :
        utils.urlEncode(postVarName) + "=" + utils.urlEncode(postData);
      // Add the layout name to the post data
      if (postData.length > 0) {
        postData += "&";
      }
      postData += "layout=" + utils.urlEncode(appender.getLayout().toString());
    }
    return postData;
  }

  function scheduleSending() {
    window.setTimeout(sendAll, timerInterval);
  }

  function xmlHttpErrorHandler() {
    var msg = "AjaxAppender: could not create XMLHttpRequest object. AjaxAppender disabled";
    utils.handleError(msg);
    isSupported = false;
    if (failCallback) {
      failCallback(msg);
    }
  }

  function sendRequest(postData, successCallback) {
    try {
      var xmlHttp = getXmlHttp(xmlHttpErrorHandler);
      if (isSupported) {
        if (xmlHttp.overrideMimeType) {
          xmlHttp.overrideMimeType(appender.getLayout().getContentType());
        }
        xmlHttp.onreadystatechange = function() {
          if (xmlHttp.readyState == 4) {
            if (isHttpRequestSuccessful(xmlHttp)) {
              if (requestSuccessCallback) {
                requestSuccessCallback(xmlHttp);
              }
              if (successCallback) {
                successCallback(xmlHttp);
              }
            } else {
              var msg = "AjaxAppender.append: XMLHttpRequest request to URL " +
                url + " returned status code " + xmlHttp.status;
              utils.handleError(msg);
              if (failCallback) {
                failCallback(msg);
              }
            }
            xmlHttp.onreadystatechange = utils.emptyFunction;
            xmlHttp = null;
          }
        };
        xmlHttp.open("POST", url, true);
        try {
          for (var i = 0, header; header = headers[i++]; ) {
            xmlHttp.setRequestHeader(header.name, header.value);
          }
          xmlHttp.setRequestHeader("Content-Type", contentType);
        } catch (headerEx) {
          var msg = "AjaxAppender.append: your browser's XMLHttpRequest implementation" +
            " does not support setRequestHeader, therefore cannot post data. AjaxAppender disabled";
          utils.handleError(msg);
          isSupported = false;
          if (failCallback) {
            failCallback(msg);
          }
          return;
        }
        xmlHttp.send(postData);
      }
    } catch (ex) {
      var errMsg = "AjaxAppender.append: error sending log message to " + url;
      utils.handleError(errMsg, ex);
      isSupported = false;
      if (failCallback) {
        failCallback(errMsg + ". Details: " + utils.getExceptionStringRep(ex));
      }
    }
  }

  this.append = function(loggingEvent) {
    if (isSupported) {
      if (!initialized) {
        init();
      }
      queuedLoggingEvents.push(loggingEvent);
      var actualBatchSize = this.getLayout().allowBatching() ? batchSize : 1;

      if (queuedLoggingEvents.length >= actualBatchSize) {
        var currentLoggingEvent;
        var batchedLoggingEvents = [];
        while ((currentLoggingEvent = queuedLoggingEvents.shift())) {
          batchedLoggingEvents.push(currentLoggingEvent);
        }
        // Queue this batch of log entries
        queuedRequests.push(batchedLoggingEvents);

        // If using a timer, the queue of requests will be processed by the
        // timer function, so nothing needs to be done here.
        if (!timed && (!waitForResponse || (waitForResponse && !sending))) {
          sendAll();
        }
      }
    }
  };

  function init() {
    initialized = true;
    // Add unload event to send outstanding messages
    if (sendAllOnUnload) {
      var oldBeforeUnload = window.onbeforeunload;
      window.onbeforeunload = function() {
        if (oldBeforeUnload) {
          oldBeforeUnload();
        }
        if (sendAllRemaining()) {
          return "Sending log messages";
        }
      };
    }
    // Start timer
    if (timed) {
      scheduleSending();
    }
  }
}

AjaxAppender.prototype = new Appender();

AjaxAppender.prototype.defaults = {
  waitForResponse: false,
  timed: false,
  timerInterval: 1000,
  batchSize: 1,
  sendAllOnUnload: false,
  requestSuccessCallback: null,
  failCallback: null,
  postVarName: "data",
  contentType: "application/x-www-form-urlencoded"
};

AjaxAppender.prototype.layout = new HttpPostDataLayout();

AjaxAppender.prototype.toString = function() {
  return "AjaxAppender";
};

/* ---------------------------------------------------------------------- */
// AjaxAppender related

var xmlHttpFactories = [
  function() { return new XMLHttpRequest(); },
  function() { return new ActiveXObject("Msxml2.XMLHTTP"); },
  function() { return new ActiveXObject("Microsoft.XMLHTTP"); }
];

var getXmlHttp = function(errorHandler) {
  // This is only run the first time; the value of getXmlHttp gets
  // replaced with the factory that succeeds on the first run
  var xmlHttp = null, factory;
  for (var i = 0, len = xmlHttpFactories.length; i < len; i++) {
    factory = xmlHttpFactories[i];
    try {
      xmlHttp = factory();
      getXmlHttp = factory;
      return xmlHttp;
    } catch (e) {
    }
  }
  // If we're here, all factories have failed, so throw an error
  if (errorHandler) {
    errorHandler();
  } else {
    utils.handleError("getXmlHttp: unable to obtain XMLHttpRequest object");
  }
};

function isHttpRequestSuccessful(xmlHttp) {
  return utils.isUndefined(xmlHttp.status) || xmlHttp.status === 0 ||
    (xmlHttp.status >= 200 && xmlHttp.status < 300) ||
    xmlHttp.status == 1223 /* Fix for IE */;
}

module.exports = exports = AjaxAppender;