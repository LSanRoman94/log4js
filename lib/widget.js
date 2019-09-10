var Appender = require('./appenders/appender');

function createWidget(log4js) {

  var logger = log4js.getRootLogger();

  // 
  function setOption(selectElement, value) {
    var options = selectElement.options;
    for (var i = 0, optionsLength = options.length; i < optionsLength; i++) {
      if (options[i].value == value) {
        selectElement.selectedIndex = i;
        return true;
      }
    }
    return false;
  }


  var loggerWindow = null;
  var logMessages = [];

  function createLoggerWindow() {
    if (loggerWindow && loggerWindow.parentElement) {
      loggerWindow.parentElement.removeChild(loggerWindow);
    }

    //Create and append select list
    loggerWindow = document.createElement("div");
    loggerWindow.id = "loggerWindow";
    loggerWindow.style.position = "fixed";
    loggerWindow.style.top = "0";
    loggerWindow.style.right = "0";
    loggerWindow.style.background = "rgba(0,0,0,.85)";
    loggerWindow.style.zIndex = 9999;
    loggerWindow.style.maxWidth = "450px";

    document.body.appendChild(loggerWindow);


    //////////////

    //Create array of options to be added
    var names = [];
    var values = [];
    var loggers = [];

    function recurseLoggers(logger, depth) {
      var str = '';
      for (var i = 0; i < depth; i++) {
        str += '--';
      }
      str += logger.name;
      names.push(str);
      values.push(logger.name);
      loggers.push(logger);

      console.log(str)
      logger.children.forEach(function(c) {
        return recurseLoggers(c, depth + 1)
      })
    }
    recurseLoggers(logger, 0)


    var loggerSelect = document.createElement("select");
    loggerSelect.id = "loggerSelect";

    for (var i = 0; i < names.length; i++) {
      var option = document.createElement("option");
      option.value = values[i];
      option.text = names[i];
      loggerSelect.appendChild(option);
    }
    loggerSelect.onchange = updateLogger;

    loggerWindow.appendChild(loggerSelect);

    //////////

    const logLevels = [
      "ALL",
      "DEBUG",
      "INFO",
      "WARN",
      "ERROR",
      "FATAL",
      "OFF",
      "TRACE"
    ];
    var levelSelect = document.createElement("select");
    levelSelect.id = "levelSelect";

    for (var i = 0; i < logLevels.length; i++) {
      var option = document.createElement("option");
      option.value = logLevels[i];
      option.text = logLevels[i];
      levelSelect.appendChild(option);
    }
    levelSelect.onchange = updateLogger;

    loggerWindow.appendChild(levelSelect);


    ///////////

    var logConsole = document.createElement("div");
    logConsole.id = "logConsole";
    logConsole.style.color = "white";
    logConsole.style.maxHeight = "200px";
    logConsole.style.overflow = "auto";
    logConsole.style.fontSize = "8px";
    logConsole.style.fontFamily = "Courier";

    /////////////

    var clearButton = document.createElement("button");
    clearButton.innerHTML = "clear";
    clearButton.onclick = () => {
      logConsole.innerHTML = "";
    };

    loggerWindow.appendChild(clearButton);

    var saveButton = document.createElement("button");
    saveButton.innerHTML = "save";
    saveButton.onclick = () => {
      // download to html file
      var text = logConsole.innerHTML;
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', Date.now() + '.htm');

      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };

    loggerWindow.appendChild(saveButton);

    // add the console last
    loggerWindow.appendChild(logConsole);


    function updateLogger() {

      for (var i = 0; i < loggers.length; i++) {
        loggers[i].removeAllAppenders();
      }

      var DivAppender = function(log4js) {
        this.log4js = log4js;
      };

      DivAppender.prototype = new Appender();
      DivAppender.prototype.threshold = log4js.Level[levelSelect.value];
      DivAppender.prototype.append = function(loggingEvent) {
        var newElement = document.createElement("div");

        newElement.innerHTML = '<b>' + loggingEvent.logger.name + '</b>: ' + loggingEvent.messages.reduce((a, b) => {
          return a + b;
        }, "");
        logConsole.appendChild(newElement);
        logConsole.scrollTop = logConsole.scrollHeight;
      };


      var selectedLogger = loggers.filter(l => l.name === loggerSelect.value)[0];
      if (selectedLogger) {
        var divAppender = new DivAppender(log4js);
        selectedLogger.addAppender(divAppender);
      }

    }

    updateLogger();

  }

  window.createLoggerWindow = createLoggerWindow;
  window.log4jsLogger = logger;
}


module.exports = exports = {
  createWidget: createWidget
};