#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/en_CA"));
  // en_CA meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "en_CA"), "am", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "en_CA"), "pm", "post meridiem lower case");

  // en_CA meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "en_CA"), "AM", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "en_CA"), "PM", "post meridiem upper case");
});
