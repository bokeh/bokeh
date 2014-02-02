#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/es_CO"));
  // es_CO meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "es_CO"), "am", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "es_CO"), "pm", "post meridiem lower case");

  // es_CO meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "es_CO"), "AM", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "es_CO"), "PM", "post meridiem upper case");
});
