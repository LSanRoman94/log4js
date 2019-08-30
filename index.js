/**
 * Copyright 2013 Tim Down.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * log4javascript
 *
 * log4javascript is a logging framework for JavaScript based on log4j
 * for Java. This file contains all core log4javascript code and is the only
 * file required to use log4javascript, unless you require support for
 * document.domain, in which case you will also need console.html, which must be
 * stored in the same directory as the main log4javascript.js file.
 *
 * Author: Tim Down <tim@log4javascript.org>
 * Version: 1.4.6
 * Edition: log4javascript
 * Build date: 19 March 2013
 * Website: http://log4javascript.org
 */

/* -------------------------------------------------------------------------- */

var log4js = require('./lib/log4js');

log4js.AjaxAppender           = require('./lib/appenders/ajax-appender');
log4js.AlertAppender          = require('./lib/appenders/alert-appender');
log4js.Appender               = require('./lib/appenders/appender');
log4js.BrowserConsoleAppender = require('./lib/appenders/browser-console-appender');
log4js.InMemoryQueueAppender  = require('./lib/appenders/in-memory-queue-appender');

log4js.SimpleDateFormat       = require('./lib/formats/simple-date-format');

log4js.HttpPostDataLayout     = require('./lib/layouts/http-post-data-layout');
log4js.JsonLayout             = require('./lib/layouts/json-layout');
log4js.InMemoryObjectLayout   = require('./lib/layouts/in-memory-object-layout');
log4js.Layout                 = require('./lib/layouts/layout');
log4js.NullLayout             = require('./lib/layouts/null-layout');
log4js.PatternLayout          = require('./lib/layouts/pattern-layout');
log4js.SimpleLayout           = require('./lib/layouts/simple-layout');
log4js.XmlLayout              = require('./lib/layouts/xml-layout');

log4js.Level                  = require('./lib/level');

log4js.dumpToConsole = function(numMessages) {
  log4js.inMemoryLogger.dumpToConsole(numMessages);
}

require('./lib/util/util').setLog4js(log4js);

// If we are running in a page script, enable users to create a logging widget on demand
if (typeof window !== 'undefined') {
  try {
    require('./lib/widget').createWidget(log4js);
  } catch (e) {}
}

module.exports = exports = log4js;