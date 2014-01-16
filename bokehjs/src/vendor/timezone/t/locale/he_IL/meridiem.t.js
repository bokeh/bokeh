#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/he_IL"));
  // he_IL meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "he_IL"), "am", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "he_IL"), "pm", "post meridiem lower case");

  // he_IL meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "he_IL"), "AM", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "he_IL"), "PM", "post meridiem upper case");
});
