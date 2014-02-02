#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/es_VE"));
  // es_VE meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "es_VE"), "am", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "es_VE"), "pm", "post meridiem lower case");

  // es_VE meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "es_VE"), "am", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "es_VE"), "pm", "post meridiem upper case");
});
