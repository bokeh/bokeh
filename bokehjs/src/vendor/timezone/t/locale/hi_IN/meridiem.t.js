#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/hi_IN"));
  // hi_IN meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "hi_IN"), "पूर्वाह्न", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "hi_IN"), "अपराह्न", "post meridiem lower case");

  // hi_IN meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "hi_IN"), "पूर्वाह्न", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "hi_IN"), "अपराह्न", "post meridiem upper case");
});
