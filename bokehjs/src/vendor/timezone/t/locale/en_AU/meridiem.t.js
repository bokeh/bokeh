#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/en_AU"));
  // en_AU meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "en_AU"), "am", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "en_AU"), "pm", "post meridiem lower case");

  // en_AU meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "en_AU"), "AM", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "en_AU"), "PM", "post meridiem upper case");
});
