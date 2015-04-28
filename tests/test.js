var log4js = require('../index');

describe('log4js', function() {

  describe('the damn thing should just load', function() {

    var appender;
    var layout;

    afterEach(function(){
      var log = log4js.getLogger();
      appender.setLayout(layout);
      appender.setThreshold(log4js.Level.ERROR);
      log.addAppender(appender);

      log.debug("Debugging message...");
      log.info("Info message...");
      log.warn("Warning message...");
      log.error("Error message...");
      log.fatal("Fatal message...");
    });

    it('#fromString', function() {
      appender = new log4js.BrowserConsoleAppender(log4js);
      layout = new log4js.PatternLayout("%d{HH:mm:ss} %-5p - %m%n");
    });


    it('Json Layout', function() {
      appender = new log4js.BrowserConsoleAppender(log4js);
      layout = new log4js.JsonLayout(true, false);
    });

  });
});