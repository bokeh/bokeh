#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/es_PE"));
  // es_PE meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "es_PE"), "am", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "es_PE"), "pm", "post meridiem lower case");

  // es_PE meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "es_PE"), "AM", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "es_PE"), "PM", "post meridiem upper case");
});
