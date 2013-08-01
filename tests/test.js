var log4js = require('../lib/index')



describe('log4js', function() {

  describe('the damn thing should just load', function() {

    it('#fromString', function() {
      console.log(['log4js', log4js]);

      var log = log4js.getLogger();
      var popUpAppender = new log4js.BrowserConsoleAppender();
      var popUpLayout = new log4js.PatternLayout("%d{HH:mm:ss} %-5p - %m%n");

      console.log(['popupAppender', popUpAppender]);
      console.log(['popupLayout', popUpLayout]);
      popUpAppender.setLayout(popUpLayout);
      popUpAppender.setThreshold(log4js.Level.ERROR);
      log.addAppender(popUpAppender);


      log.debug("Debugging message (appears in pop-up)");
      log.error("Error message (appears in pop-up and in server log)");
    });

  });
});